import puppeteer from 'puppeteer';
import fs from 'fs/promises';

async function scrapeAdjustments() {
  console.log('🚀 Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  await page.setUserAgent(
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  );

  await page.setRequestInterception(true);

  const capturedData = {
    seasonData: null,
    heroList: [],
    heroDetails: {}
  };

  page.on('request', (request) => {
    request.continue();
  });

  page.on('response', async (response) => {
    const url = response.url();

    if (url.includes('api-camp.honorofkings.com')) {
      try {
        const contentType = response.headers()['content-type'];

        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();

          if (url.includes('adjustforseason') && data.data?.adjustList) {
            capturedData.seasonData = data.data;
            console.log(`✅ Season ${data.data.seasonName}: ${data.data.adjustList.length} adjustments`);
          }

          if (url.includes('getallherobriefinfo') && data.data?.heroList) {
            capturedData.heroList = data.data.heroList;
            console.log(`✅ Hero list: ${data.data.heroList.length} heroes`);
          }

          // Capture detailed hero adjustment info
          if (url.includes('adjustheroinfo') && data.data?.heroInfo) {
            const heroId = data.data.heroInfo.heroId;
            capturedData.heroDetails[heroId] = data.data;
            console.log(`   ✅ Got details for: ${data.data.heroInfo.heroName}`);
          }
        }
      } catch (error) {
        // Ignore JSON parse errors (preflight requests, etc)
      }
    }
  });

  try {
    // Visit adjustment-detail page first
    console.log('\n📥 Visiting adjustment-detail page...');
    await page.goto('https://camp.honorofkings.com/h5/app/index.html#/adjustment-detail', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });
    await new Promise(resolve => setTimeout(resolve, 4000));

    // Get hero IDs
    const heroIds = capturedData.seasonData?.adjustList?.map(adj => adj.heroInfo?.heroId).filter(Boolean) || [];
    const versionName = capturedData.seasonData?.versionName || '2026/02/05';

    console.log(`\n📋 Found ${heroIds.length} heroes with adjustments`);

    // Fetch each hero's detail using new page
    for (let i = 0; i < heroIds.length; i++) {
      const heroId = heroIds[i];
      const heroName = capturedData.seasonData?.adjustList[i]?.heroInfo?.heroName || `Hero ${heroId}`;

      console.log(`\n[${i + 1}/${heroIds.length}] Fetching ${heroName}...`);

      const detailPage = await browser.newPage();
      await detailPage.setUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      );
      await detailPage.setRequestInterception(true);

      detailPage.on('request', (request) => request.continue());

      detailPage.on('response', async (response) => {
        const url = response.url();
        if (url.includes('adjustheroinfo')) {
          try {
            const data = await response.json();
            if (data.data?.heroInfo) {
              capturedData.heroDetails[data.data.heroInfo.heroId] = data.data;
              console.log(`   ✅ Got details for: ${data.data.heroInfo.heroName}`);
            }
          } catch (e) {}
        }
      });

      await detailPage.goto(
        `https://camp.honorofkings.com/h5/app/index.html#/adjustment-detail?heroId=${heroId}&versionName=${encodeURIComponent(versionName)}`,
        { waitUntil: 'networkidle2', timeout: 30000 }
      );
      await new Promise(resolve => setTimeout(resolve, 2500));
      await detailPage.close();
    }

    // Format output with detailed skill changes
    const output = {
      scrapedAt: new Date().toISOString(),
      season: {
        id: capturedData.seasonData?.seasonId,
        name: capturedData.seasonData?.seasonName,
        versionName: capturedData.seasonData?.versionName
      },
      adjustments: (capturedData.seasonData?.adjustList || []).map(adj => {
        const heroId = adj.heroInfo?.heroId;
        const detail = capturedData.heroDetails[heroId];

        // Get current season's adjustment info
        const currentAdjust = detail?.adjustInfo?.find(a => a.isCurrent) || detail?.adjustInfo?.[0];

        // Format stats properly
        const formatPercent = (val) => {
          if (typeof val === 'number') {
            if (val < 1) {
              return Math.round(val * 10000) / 100;
            }
            return Math.round(val * 100) / 100;
          }
          return val;
        };

        return {
          heroId: heroId,
          heroName: adj.heroInfo?.heroName,
          heroIcon: adj.heroInfo?.icon,
          shortDesc: adj.shortDesc,
          type: adj.contentTag?.text,
          tagEnum: adj.contentTag?.tagEnum,
          tagColor: adj.contentTag?.bgColorH5,
          stats: {
            winRate: formatPercent(adj.heroInfo?.winningProbability),
            pickRate: formatPercent(adj.heroInfo?.appearanceRate),
            banRate: formatPercent(adj.heroInfo?.banRote)
          },
          // Detailed skill changes from adjustInfo
          skillChanges: currentAdjust?.adjustContent?.attribute?.map(attr => ({
            skillName: attr.heroSkillInfo?.skillName || attr.title,
            skillIcon: attr.heroSkillInfo?.skillIcon || '',
            skillIndex: attr.heroSkillInfo?.skillIndexDesc || '',
            title: attr.title,
            description: attr.attributeDesc,
            // Clean description for display
            descriptionText: attr.attributeDesc?.replace(/<br>/g, '\n').replace(/<[^>]*>/g, '')
          })) || []
        };
      }),
      heroList: capturedData.heroList.map(h => ({
        heroId: h.heroId,
        heroName: h.heroName,
        icon: h.icon
      }))
    };

    console.log(`\n📊 Summary:`);
    console.log(`   Season: ${output.season.name}`);
    console.log(`   Adjustments: ${output.adjustments.length}`);
    console.log(`   With skill details: ${output.adjustments.filter(a => a.skillChanges.length > 0).length}`);
    console.log(`   Hero list: ${output.heroList.length}`);

    await fs.mkdir('./scripts/output', { recursive: true });
    await fs.writeFile(
      './scripts/output/adjustments-data.json',
      JSON.stringify(output, null, 2)
    );

    console.log('\n✅ Saved to: ./scripts/output/adjustments-data.json');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
    console.log('\n👋 Done!');
  }
}

scrapeAdjustments().catch(console.error);
