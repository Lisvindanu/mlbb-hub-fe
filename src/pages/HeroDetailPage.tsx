import { useParams, Link } from '@tanstack/react-router';
import { ArrowLeft, Shield, X, ChevronLeft, ChevronRight, Users, Crosshair, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useHeroById } from '../hooks/useHeroes';
import { Loading } from '../components/ui/Loading';
import { getTierColor } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchHeroBuilds } from '../api/items';

const API_BASE = import.meta.env.DEV ? 'http://localhost:8090' : 'https://mlbbapi.project-n.site';
function resolveUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('/')) return `${API_BASE}${url}`;
  return url;
}

export function HeroDetailPage() {
  const { heroId } = useParams({ from: '/heroes/$heroId' });
  const { data: hero, isLoading } = useHeroById(parseInt(heroId));
  const [selectedSkinIndex, setSelectedSkinIndex] = useState<number | null>(null);
  const [activeSkillMode, setActiveSkillMode] = useState(0);
  const [activeBuildIndex, setActiveBuildIndex] = useState(0);

  const { data: builds = [] } = useQuery({
    queryKey: ['builds', hero?.name],
    queryFn: () => fetchHeroBuilds(hero!.name),
    enabled: !!hero?.name,
    staleTime: 1000 * 60 * 30,
  });

  const API_BASE = import.meta.env.DEV ? '' : 'https://mlbbapi.project-n.site';
  const { data: heroBalanceHistory = [] } = useQuery({
    queryKey: ['patches-hero', hero?.name],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/patches?hero=${encodeURIComponent(hero!.name)}`);
      if (!res.ok) return [];
      return res.json() as Promise<{ version: string; releaseDate: string | null; changes: { hero: string; type: string; note: string; changes: string }[] }[]>;
    },
    enabled: !!hero?.name,
    staleTime: 1000 * 60 * 30,
  });

  useEffect(() => {
    if (hero) {
      document.title = `${hero.name} - ${hero.title || hero.role} Guide | MLBB Hub`;
      const desc = document.querySelector('meta[name="description"]');
      if (desc) desc.setAttribute('content', `${hero.name} (${hero.title || hero.role}) - Mobile Legends: Bang Bang hero guide. Skills, skins, counter picks, and balance history.`);
    }
    return () => {
      document.title = 'MLBB Hub - Mobile Legends: Bang Bang Community Hub';
      const desc = document.querySelector('meta[name="description"]');
      if (desc) desc.setAttribute('content', 'Platform komunitas Mobile Legends: Bang Bang terlengkap. Panduan hero, tier list, patch notes, counter pick, dan build item gratis untuk pemain ML Indonesia.');
    };
  }, [hero]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading message="Memuat detail hero..." />
      </div>
    );
  }

  if (!hero) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-display font-bold mb-4">Hero Tidak Ditemukan</h1>
          <p className="text-gray-400 mb-8">Hero yang kamu cari tidak ada.</p>
          <Link to="/heroes" className="px-6 py-3 bg-white text-dark-400 rounded-xl font-medium hover:bg-gray-100 transition-colors">
            Kembali ke Hero
          </Link>
        </div>
      </div>
    );
  }

  // Helper: Group skills for multi-mode heroes
  const getSkillGroups = () => {
    // Use skillSets from API if available (transform/multi-form heroes)
    if (hero.skillSets && hero.skillSets.length > 1) {
      return hero.skillSets.map(ss => ({ name: ss.name, skills: ss.skills }));
    }

    return [{ name: 'Skills', skills: hero.skill || [] }];
  };

  const skillGroups = getSkillGroups();
  const isMultiMode = skillGroups.length > 1;

  return (
    <div className="min-h-screen bg-dark-400">
      {/* Hero Header */}
      <section className="relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          <img
            src={hero.icon}
            alt={hero.name}
            className="w-full h-full object-cover blur-xl scale-125 opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-dark-400/50 via-dark-400/70 to-dark-400" />
          <div className="absolute inset-0 bg-gradient-to-r from-dark-400/80 via-transparent to-dark-400/80" />
        </div>

        {/* Content */}
        <div className="relative container mx-auto px-4 md:px-6 lg:px-8 pt-20 md:pt-28 pb-6 md:pb-8">
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Link
              to="/heroes"
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Kembali ke Hero</span>
            </Link>
          </motion.div>

          {/* Hero Info */}
          <div className="mt-6">
            <div className="flex flex-col md:flex-row items-start md:items-end gap-6">
              {/* Hero Image */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="relative"
              >
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl overflow-hidden border-2 border-white/10 shadow-2xl">
                  <img
                    src={hero.icon}
                    alt={hero.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Tier badge */}
                <div className={`absolute -bottom-3 -right-3 px-4 py-2 rounded-xl bg-dark-400/90 backdrop-blur-sm border border-white/10 font-bold text-lg ${getTierColor(hero.stats.tier)}`}>
                  {hero.stats.tier}
                </div>
              </motion.div>

              {/* Hero Details */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="flex-1"
              >
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span className="px-3 py-1 rounded-lg bg-white/10 text-white/80 text-sm font-medium">
                    {hero.role}
                  </span>
                  {(hero.lanes && hero.lanes.length > 0 ? hero.lanes : [hero.lane]).map((lane) => (
                    <span key={lane} className="px-3 py-1 rounded-lg bg-white/5 text-white/60 text-sm">
                      {lane}
                    </span>
                  ))}
                </div>

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white mb-4">
                  {hero.name}
                </h1>

                {/* Quick Stats */}
                <div className="flex items-center gap-5">
                  <div>
                    <p className="text-xl font-bold text-green-400">{hero.stats.winRate}</p>
                    <p className="text-xs text-gray-500">Win Rate</p>
                  </div>
                  <div className="w-px h-8 bg-white/10" />
                  <div>
                    <p className="text-xl font-bold text-blue-400">{hero.stats.pickRate}</p>
                    <p className="text-xs text-gray-500">Pick Rate</p>
                  </div>
                  <div className="w-px h-8 bg-white/10" />
                  <div>
                    <p className="text-xl font-bold text-red-400">{hero.stats.banRate}</p>
                    <p className="text-xs text-gray-500">Ban Rate</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Content Grid */}
      <section className="py-6 md:py-8">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6 md:space-y-8">
              {/* Skins Gallery */}
              {hero.skins && hero.skins.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                  className="p-4 md:p-6 bg-dark-300/50 border border-white/5 rounded-2xl"
                >
                  <div className="flex items-center justify-between mb-4 md:mb-6">
                    <h2 className="text-lg md:text-xl font-semibold text-white">Skins</h2>
                    <span className="text-xs md:text-sm text-gray-500">{hero.skins.length} tersedia</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
                    {hero.skins.map((skin, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedSkinIndex(index)}
                        className="group relative overflow-hidden rounded-xl bg-dark-200/50 transition-all duration-300 hover:ring-2 hover:ring-primary-500/50"
                      >
                        <div className="aspect-[3/4] relative overflow-hidden">
                          <img
                            src={resolveUrl(skin.skinCover || skin.skinImage || skin.skinImg)}
                            alt={skin.skinName}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            onError={(e) => {
                              e.currentTarget.src = 'https://via.placeholder.com/400x600?text=No+Image';
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-dark-400 via-transparent to-transparent" />

                          {/* Tier Badge */}
                          {skin.tierName && (
                            <div
                              className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide shadow-lg"
                              style={{
                                backgroundColor: skin.tierColor || '#8B5CF6',
                                color: '#fff',
                                textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                              }}
                            >
                              {skin.tierName}
                            </div>
                          )}

                          {/* Collab Badge */}
                          {skin.collab && (
                            <div
                              className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide shadow-lg"
                              style={{
                                backgroundColor: skin.collab.color || '#FFD700',
                                color: '#fff',
                                textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                              }}
                            >
                              {skin.collab.name}
                            </div>
                          )}

                          {/* Skin name */}
                          <div className="absolute bottom-0 left-0 right-0 p-3">
                            <p className="text-sm font-medium text-white truncate">
                              {skin.skinName}
                            </p>
                            {skin.skinSeries && (
                              <p className="text-xs text-gray-400 truncate mt-0.5">
                                {skin.skinSeries}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Skills Section */}
              {hero.skill && hero.skill.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.32 }}
                  className="p-4 md:p-6 bg-dark-300/50 border border-white/5 rounded-2xl"
                >
                  <div className="flex items-center justify-between mb-4 md:mb-6">
                    <h2 className="text-lg md:text-xl font-semibold text-white">Skill</h2>
                    {isMultiMode && (
                      <span className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-lg">
                        Hero Multi-Mode • {hero.skill.length} Skill
                      </span>
                    )}
                  </div>

                  {/* Mode Tabs */}
                  {isMultiMode && (
                    <div className="flex gap-2 mb-4 overflow-x-auto">
                      {skillGroups.map((group, idx) => (
                        <button
                          key={idx}
                          onClick={() => setActiveSkillMode(idx)}
                          className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
                            activeSkillMode === idx
                              ? 'bg-primary-500 text-white'
                              : 'bg-dark-200/50 text-gray-400 hover:bg-dark-200 hover:text-white'
                          }`}
                        >
                          {group.name}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Skills Display */}
                  <div className="space-y-3 md:space-y-4">
                    {skillGroups[activeSkillMode]?.skills.map((skill, index) => {
                      // Determine skill label
                      let skillLabel = '';
                      if (index === 0) {
                        skillLabel = 'Passive';
                      } else if (skill.skillName.toLowerCase().includes('awakening')) {
                        skillLabel = 'Ultimate';
                      } else if (!isMultiMode) {
                        const totalSkills = skillGroups[0].skills.length;
                        skillLabel = index === totalSkills - 1 ? 'Ultimate' : `Skill ${index}`;
                      } else {
                        // For multi-mode, show proper labels within each mode
                        const skillsInMode = skillGroups[activeSkillMode].skills.length;
                        if (index === skillsInMode - 1) {
                          skillLabel = 'Ultimate';
                        } else if (index > 0) {
                          skillLabel = `Skill ${index}`;
                        }
                      }

                      return (
                        <div
                          key={index}
                          className="flex gap-3 md:gap-4 p-3 md:p-4 bg-dark-200/50 rounded-xl border border-white/5 hover:border-primary-500/20 transition-all"
                        >
                          <div className="flex-shrink-0">
                            <img
                              src={resolveUrl(skill.skillImg)}
                              alt={skill.skillName}
                              className="w-12 h-12 md:w-14 md:h-14 rounded-xl border border-white/10"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-sm font-semibold text-white">
                                {skillLabel && `${skillLabel}: `}{skill.skillName}
                              </h3>
                            </div>
                            <p className="text-xs text-gray-400 leading-relaxed line-clamp-3">
                              {skill.skillDesc}
                            </p>
                            <div className="flex gap-4 mt-2">
                              {skill.cooldown && skill.cooldown[0] > 0 && (
                                <span className="text-[10px] text-blue-400">
                                  CD: {skill.cooldown.join('/')}s
                                </span>
                              )}
                              {skill.cost && skill.cost[0] > 0 && (
                                <span className="text-[10px] text-cyan-400">
                                  Cost: {skill.cost.join('/')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* Top Builds Section */}
              {builds.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.33 }}
                  className="p-4 md:p-6 bg-dark-300/50 border border-white/5 rounded-2xl"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg md:text-xl font-semibold text-white">Top Builds</h2>
                    {/* Build tabs */}
                    <div className="flex gap-1">
                      {builds.map((_: any, i: number) => (
                        <button
                          key={i}
                          onClick={() => setActiveBuildIndex(i)}
                          className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                            activeBuildIndex === i
                              ? 'bg-primary-500 text-white'
                              : 'bg-dark-200 text-gray-400 hover:bg-dark-100'
                          }`}
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>
                  </div>

                  {builds[activeBuildIndex] && (() => {
                    const build = builds[activeBuildIndex];
                    return (
                      <div className="space-y-4">
                        {/* Items */}
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Items</p>
                          <div className="flex gap-2 flex-wrap">
                            {build.items.map((item: any, idx: number) => (
                              <div key={idx} className="group relative">
                                <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/10 bg-dark-200">
                                  <img src={item.icon} alt={item.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                </div>
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-dark-400 border border-white/10 rounded text-xs text-white whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 pointer-events-none">
                                  {item.name}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Emblem + Spell + Talents */}
                        <div className="flex flex-wrap gap-4">
                          {/* Emblem */}
                          {build.emblem && (
                            <div>
                              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Emblem</p>
                              <div className="flex items-center gap-2">
                                <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/10 bg-dark-200">
                                  <img src={build.emblem.icon} alt={build.emblem.name} className="w-full h-full object-contain p-1" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                </div>
                                <span className="text-sm text-white">{build.emblem.name}</span>
                              </div>
                            </div>
                          )}

                          {/* Battle Spell */}
                          {build.battleSpell && (
                            <div>
                              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Battle Spell</p>
                              <div className="flex items-center gap-2 px-3 py-1.5 bg-dark-200 rounded-lg border border-white/10">
                                <img
                                  src={`/images/spells/${build.battleSpell.replace(/ /g, '_')}.webp`}
                                  alt={build.battleSpell}
                                  className="w-7 h-7 rounded object-contain"
                                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                />
                                <span className="text-sm text-white">{build.battleSpell}</span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Talents */}
                        {build.talents?.length > 0 && (
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Talents</p>
                            <div className="flex gap-2 flex-wrap">
                              {build.talents.map((talent: any, idx: number) => (
                                <div key={idx} className="group relative flex items-center gap-2 px-3 py-1.5 bg-dark-200 rounded-lg border border-white/10">
                                  {talent.icon && (
                                    <img src={talent.icon} alt={talent.name} className="w-5 h-5 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                  )}
                                  <span className="text-sm text-white">{talent.name}</span>
                                  {talent.benefits && (
                                    <div className="absolute bottom-full left-0 mb-1 px-2 py-1 bg-dark-400 border border-white/10 rounded text-xs text-gray-300 whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 pointer-events-none">
                                      {talent.benefits}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </motion.div>
              )}

              {/* Arcana Section */}
              {hero.arcana && hero.arcana.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.35 }}
                  className="p-4 md:p-6 bg-dark-300/50 border border-white/5 rounded-2xl"
                >
                  <div className="flex items-center justify-between mb-4 md:mb-6">
                    <h2 className="text-lg md:text-xl font-semibold text-white">Emblem yang Direkomendasikan</h2>
                    <span className="text-xs md:text-sm text-gray-500">{hero.arcana.length} slot</span>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-2 md:gap-3">
                    {hero.arcana.map((arcana, index) => (
                      <div
                        key={index}
                        className="group relative bg-dark-200/50 rounded-xl p-2 md:p-3 border border-white/5 hover:border-primary-500/30 transition-all"
                      >
                        <div className="flex flex-col items-center text-center">
                          <img
                            src={arcana.icon}
                            alt={arcana.name}
                            className="w-10 h-10 md:w-12 md:h-12 rounded-lg mb-1.5 md:mb-2"
                            onError={(e) => {
                              e.currentTarget.src = 'https://via.placeholder.com/48?text=?';
                            }}
                          />
                          <p className="text-xs font-medium text-white line-clamp-2">{arcana.name}</p>
                          <p className="text-[10px] text-gray-500 mt-1">Lv.{arcana.level}</p>
                        </div>
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-dark-400 border border-white/10 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 pointer-events-none">
                          <p className="text-xs text-white font-medium mb-1">{arcana.name}</p>
                          <p className="text-[10px] text-gray-400 whitespace-pre-line">{arcana.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Equipment Section */}
              {hero.recommendedEquipment && hero.recommendedEquipment.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                  className="p-4 md:p-6 bg-dark-300/50 border border-white/5 rounded-2xl"
                >
                  <div className="flex items-center justify-between mb-4 md:mb-6">
                    <div>
                      <h2 className="text-lg md:text-xl font-semibold text-white">Build yang Direkomendasikan</h2>
                      {hero.buildTitle && (
                        <p className="text-xs md:text-sm text-gray-500 mt-1">{hero.buildTitle}</p>
                      )}
                    </div>
                    <span className="text-xs md:text-sm text-gray-500">{hero.recommendedEquipment.length} item</span>
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-2">
                    {hero.recommendedEquipment.map((item, index) => (
                      <div
                        key={index}
                        className="group relative"
                      >
                        <div className={`relative bg-dark-200/50 rounded-xl p-2 border transition-all ${
                          item.isCore
                            ? 'border-yellow-500/50 ring-1 ring-yellow-500/20'
                            : 'border-white/5 hover:border-primary-500/30'
                        }`}>
                          <img
                            src={item.icon}
                            alt={item.name}
                            className="w-full aspect-square rounded-lg"
                            onError={(e) => {
                              e.currentTarget.src = 'https://via.placeholder.com/48?text=?';
                            }}
                          />
                          {item.isCore && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
                              <span className="text-[8px] text-black font-bold">★</span>
                            </div>
                          )}
                        </div>
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-3 bg-dark-400 border border-white/10 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 pointer-events-none">
                          <div className="flex items-start gap-2 mb-2">
                            <img src={item.icon} alt="" className="w-8 h-8 rounded" />
                            <div>
                              <p className="text-sm text-white font-medium">{item.name}</p>
                              <p className="text-xs text-yellow-500">{item.price} gold</p>
                            </div>
                          </div>
                          <p className="text-[10px] text-gray-400 whitespace-pre-line">{item.description}</p>
                          {item.passiveSkills && item.passiveSkills.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-white/10">
                              {item.passiveSkills.map((passive, i) => (
                                <p key={i} className="text-[10px] text-primary-400">{passive.name}</p>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4 md:space-y-6">
              {/* Lore */}
              {hero.world && (hero.world.region || hero.world.identity) && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  className="p-4 md:p-6 bg-dark-300/50 border border-white/5 rounded-2xl"
                >
                  <h2 className="text-base md:text-lg font-semibold text-white mb-3 md:mb-4">Lore</h2>
                  <div className="space-y-4">
                    {hero.world.region && (
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Wilayah</p>
                        <p className="text-white">{hero.world.region}</p>
                      </div>
                    )}
                    {hero.world.identity && (
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Identitas</p>
                        <p className="text-white">{hero.world.identity}</p>
                      </div>
                    )}
                    {hero.world.energy && (
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Energi</p>
                        <p className="text-white">{hero.world.energy}</p>
                      </div>
                    )}
                    {hero.world.height && (
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Tinggi</p>
                        <p className="text-white">{hero.world.height}</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Best Partners */}
              {hero.bestPartners && Object.keys(hero.bestPartners).length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.25 }}
                  className="p-4 md:p-6 bg-dark-300/50 border border-white/5 rounded-2xl"
                >
                  <div className="flex items-center gap-2 mb-3 md:mb-4">
                    <Users className="w-4 h-4 text-blue-400" />
                    <h2 className="text-base md:text-lg font-semibold text-white">Partner Terbaik</h2>
                  </div>
                  <div className="space-y-2">
                    {Object.values(hero.bestPartners).slice(0, 5).map((partner, index) => (
                      <div key={index} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors">
                        <img
                          src={partner.thumbnail}
                          alt={partner.name}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                        <span className="text-sm text-white">{partner.name}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Strong Against */}
              {hero.suppressingHeroes && Object.keys(hero.suppressingHeroes).length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                  className="p-4 md:p-6 bg-dark-300/50 border border-white/5 rounded-2xl"
                >
                  <div className="flex items-center gap-2 mb-3 md:mb-4">
                    <Crosshair className="w-4 h-4 text-green-400" />
                    <h2 className="text-base md:text-lg font-semibold text-white">Kuat Melawan</h2>
                  </div>
                  <div className="space-y-2">
                    {Object.values(hero.suppressingHeroes).slice(0, 5).map((counter, index) => (
                      <div key={index} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors">
                        <img
                          src={counter.thumbnail}
                          alt={counter.name}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                        <span className="text-sm text-white">{counter.name}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Weak Against */}
              {hero.suppressedHeroes && Object.keys(hero.suppressedHeroes).length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.35 }}
                  className="p-4 md:p-6 bg-dark-300/50 border border-white/5 rounded-2xl"
                >
                  <div className="flex items-center gap-2 mb-3 md:mb-4">
                    <Shield className="w-4 h-4 text-red-400" />
                    <h2 className="text-base md:text-lg font-semibold text-white">Lemah Melawan</h2>
                  </div>
                  <div className="space-y-2">
                    {Object.values(hero.suppressedHeroes).slice(0, 5).map((counter, index) => (
                      <div key={index} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors">
                        <img
                          src={counter.thumbnail}
                          alt={counter.name}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                        <span className="text-sm text-white">{counter.name}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Recent Balance Changes */}
      {heroBalanceHistory.length > 0 && (
        <section className="py-6 md:py-8 border-t border-white/5">
          <div className="container mx-auto px-4 md:px-6 lg:px-8">
            <h2 className="text-xl md:text-2xl font-display font-bold mb-4 md:mb-6">
              Riwayat Balance
            </h2>
            <div className="space-y-3">
              {heroBalanceHistory.map((entry) => (
                <BalanceEntry key={entry.version} entry={entry} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Skin Gallery Modal */}
      <AnimatePresence>
        {selectedSkinIndex !== null && hero.skins && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 md:bg-black/90 backdrop-blur-sm"
            onClick={() => setSelectedSkinIndex(null)}
          >
            {/* Close button */}
            <button
              onClick={() => setSelectedSkinIndex(null)}
              className="absolute top-4 right-4 md:top-6 md:right-6 z-10 p-2 md:p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Previous button */}
            {selectedSkinIndex > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedSkinIndex(selectedSkinIndex - 1);
                }}
                className="absolute left-2 md:left-6 z-10 p-2 md:p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            )}

            {/* Next button */}
            {selectedSkinIndex < hero.skins.length - 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedSkinIndex(selectedSkinIndex + 1);
                }}
                className="absolute right-2 md:right-6 z-10 p-2 md:p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            )}

            {/* Main content */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-4xl w-full mx-2 md:mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Image */}
              <div className="relative rounded-xl md:rounded-2xl overflow-hidden">
                <img
                  src={resolveUrl(
                    hero.skins[selectedSkinIndex].skinCover ||
                    hero.skins[selectedSkinIndex].skinImage ||
                    hero.skins[selectedSkinIndex].skinImg
                  )}
                  alt={hero.skins[selectedSkinIndex].skinName}
                  className="w-full max-h-[60vh] md:max-h-[70vh] object-contain"
                  onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/800x1200?text=No+Image';
                  }}
                />
              </div>

              {/* Info */}
              <div className="mt-4 md:mt-6 text-center px-2">
                <div className="flex items-center justify-center gap-2 md:gap-3 mb-2">
                  {hero.skins[selectedSkinIndex].tierName && (
                    <span
                      className="px-2 md:px-3 py-0.5 md:py-1 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wide"
                      style={{
                        backgroundColor: hero.skins[selectedSkinIndex].tierColor || '#8B5CF6',
                        color: '#fff'
                      }}
                    >
                      {hero.skins[selectedSkinIndex].tierName}
                    </span>
                  )}
                  {hero.skins[selectedSkinIndex].collab && (
                    <span
                      className="px-2 md:px-3 py-0.5 md:py-1 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wide"
                      style={{
                        backgroundColor: hero.skins[selectedSkinIndex].collab.color || '#FFD700',
                        color: '#fff'
                      }}
                    >
                      {hero.skins[selectedSkinIndex].collab.name}
                    </span>
                  )}
                </div>
                <h3 className="text-lg md:text-2xl font-semibold text-white">
                  {hero.skins[selectedSkinIndex].skinName}
                </h3>
                {hero.skins[selectedSkinIndex].skinSeries && (
                  <p className="text-sm md:text-base text-primary-400 mt-1">
                    {hero.skins[selectedSkinIndex].skinSeries}
                  </p>
                )}
                <p className="text-xs md:text-sm text-gray-500 mt-2">
                  {selectedSkinIndex + 1} dari {hero.skins.length}
                </p>
              </div>

              {/* Thumbnail navigation */}
              <div className="mt-4 md:mt-6 flex justify-center gap-1.5 md:gap-2 overflow-x-auto pb-2 px-2">
                {hero.skins.map((skin, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedSkinIndex(index)}
                    className={`flex-shrink-0 w-12 h-16 md:w-16 md:h-20 rounded-lg overflow-hidden transition-all ${
                      index === selectedSkinIndex
                        ? 'ring-2 ring-primary-500 opacity-100'
                        : 'opacity-40 hover:opacity-70'
                    }`}
                  >
                    <img
                      src={resolveUrl(skin.skinCover || skin.skinImage || skin.skinImg)}
                      alt={skin.skinName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/100x150?text=No';
                      }}
                    />
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


type PatchHeroEntry = {
  version: string;
  releaseDate: string | null;
  changes: { hero: string; type: string; note: string; changes: string }[];
};

function cleanWiki(text: string): string {
  if (!text) return '';
  return text
    .replace(/\{\{ai\|[^|{}]*\|([^|{}]*)\}\}/g, '$1')
    .replace(/\{\{TextID\|([^|}]*)\}\}/g, '[$1]')
    .replace(/\{\{[^{}]*\}\}/g, '')
    .replace(/\[\[([^\]|]*\|)?([^\]]*)\]\]/g, '$2')
    .replace(/'{2,3}(.*?)'{2,3}/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function BalanceEntry({ entry }: { entry: PatchHeroEntry }) {
  const [expanded, setExpanded] = useState(false);
  const change = entry.changes[0];
  if (!change) return null;

  const type = change.type.toLowerCase();
  const typeColor =
    type === 'buff' ? { text: 'text-green-400', bg: 'bg-green-500/15', border: 'border-l-green-500' }
    : type === 'nerf' ? { text: 'text-red-400', bg: 'bg-red-500/15', border: 'border-l-red-500' }
    : type === 'revamp' ? { text: 'text-purple-400', bg: 'bg-purple-500/15', border: 'border-l-purple-500' }
    : { text: 'text-blue-400', bg: 'bg-blue-500/15', border: 'border-l-blue-500' };

  const TypeIcon = type === 'buff' ? TrendingUp : type === 'nerf' ? TrendingDown : Minus;
  const hasDetails = !!change.changes;

  return (
    <div className={`bg-dark-300/50 border border-white/5 border-l-4 ${typeColor.border} rounded-xl overflow-hidden`}>
      <button
        onClick={() => hasDetails && setExpanded(!expanded)}
        className={`w-full text-left p-4 flex items-start gap-3 ${hasDetails ? 'hover:bg-white/3 transition-colors cursor-pointer' : 'cursor-default'}`}
      >
        <span className={`flex-shrink-0 px-2.5 py-1 rounded-lg text-xs font-bold ${typeColor.bg} ${typeColor.text}`}>
          {entry.version}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <TypeIcon className={`w-3.5 h-3.5 ${typeColor.text}`} />
            <span className={`text-xs font-semibold capitalize ${typeColor.text}`}>{change.type}</span>
            {entry.releaseDate && (
              <span className="text-xs text-gray-500">· {entry.releaseDate}</span>
            )}
          </div>
          {change.note && <p className="text-sm text-gray-300">{cleanWiki(change.note)}</p>}
          {!change.note && change.changes && (
            <p className="text-sm text-gray-400 line-clamp-1">{cleanWiki(change.changes).split('\n')[0]}</p>
          )}
        </div>
        {hasDetails && (
          <span className="text-xs text-gray-500 flex-shrink-0 mt-0.5">
            {expanded ? '▲' : '▼'}
          </span>
        )}
      </button>
      {expanded && hasDetails && (
        <div className="px-4 pb-4 border-t border-white/5 pt-3">
          <p className="text-sm text-gray-300 whitespace-pre-line leading-relaxed">{cleanWiki(change.changes)}</p>
        </div>
      )}
    </div>
  );
}
