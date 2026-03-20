import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Star, RotateCcw } from 'lucide-react';

const API_BASE = import.meta.env.DEV ? '' : 'https://mlbbapi.project-n.site';

interface Talent {
  name: string;
  desc: string;
  descEn?: string;
  icon: string;
  recommended: boolean;
}
interface TierGroup {
  tier: number;
  talents: Talent[];
}
interface ActiveTalent {
  name: string;
  desc: string;
  descEn?: string;
  colorHex: string;
}
interface EmblemDef {
  id: number;
  name: string;
  icon: string;
  colorHex: string;
  roles: string[];
  tiers: TierGroup[];
  activeTalents: ActiveTalent[];
  baseStats: string[];
}

async function fetchTalents(): Promise<EmblemDef[]> {
  const res = await fetch(`${API_BASE}/api/talents`);
  if (!res.ok) throw new Error('Failed to fetch talents');
  return res.json();
}

function TalentCard({ talent, selected, onToggle, colorHex, lang }: {
  talent: Talent; selected: boolean; onToggle: () => void; colorHex: string; lang: 'id' | 'en';
}) {
  return (
    <button
      onClick={onToggle}
      className="relative flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all text-center group"
      style={selected ? {
        background: `${colorHex}22`,
        boxShadow: `0 0 0 1.5px ${colorHex}88`,
      } : {}}
    >
      {talent.recommended && (
        <Star className="absolute -top-1 -right-1 w-3.5 h-3.5 fill-amber-400 text-amber-400" />
      )}
      <div
        className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 border transition-all"
        style={selected ? { borderColor: `${colorHex}99` } : { borderColor: 'rgba(255,255,255,0.1)' }}
      >
        <img
          src={talent.icon}
          alt={talent.name}
          className="w-full h-full object-contain p-1"
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = '0.3'; }}
        />
      </div>
      <span
        className="text-[10px] font-semibold leading-tight transition-colors"
        style={{ color: selected ? colorHex : 'rgb(209,213,219)' }}
      >
        {talent.name}
      </span>
      <span className="text-[9px] text-gray-500 leading-tight line-clamp-2">
        {lang === 'en' && talent.descEn ? talent.descEn : talent.desc}
      </span>
    </button>
  );
}

function EmblemCard({ emblem, lang }: { emblem: EmblemDef; lang: 'id' | 'en' }) {
  const [selected, setSelected] = useState<Record<number, string>>({});

  function toggle(tier: number, name: string) {
    setSelected(prev => prev[tier] === name ? { ...prev, [tier]: '' } : { ...prev, [tier]: name });
  }

  function reset() { setSelected({}); }

  function applyRecommended() {
    const rec: Record<number, string> = {};
    emblem.tiers.forEach(t => {
      const r = t.talents.find(x => x.recommended);
      if (r) rec[t.tier] = r.name;
    });
    setSelected(rec);
  }

  const activeSel = emblem.tiers.map(t => t.talents.find(x => x.name === selected[t.tier])).filter(Boolean);
  const hasSelection = Object.values(selected).some(Boolean);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden border"
      style={{ borderColor: `${emblem.colorHex}44`, background: 'rgba(255,255,255,0.02)' }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-4" style={{ background: `${emblem.colorHex}18`, borderBottom: `1px solid ${emblem.colorHex}33` }}>
        <div className="w-12 h-12 rounded-xl overflow-hidden border flex-shrink-0" style={{ borderColor: `${emblem.colorHex}55` }}>
          <img src={emblem.icon} alt={emblem.name} className="w-full h-full object-contain p-1" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-white uppercase tracking-wide">Custom {emblem.name} Emblem</h3>
          <div className="flex flex-wrap gap-1 mt-1">
            {emblem.roles.map(r => (
              <span key={r} className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                style={{ background: `${emblem.colorHex}33`, color: emblem.colorHex }}>
                {r}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Talent Tree */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">
              Talent Tree <span className="text-gray-600">(click to select)</span>
            </p>
            <div className="flex items-center gap-2">
              <button onClick={applyRecommended} className="flex items-center gap-1 text-[10px] text-amber-400 hover:text-amber-300 transition-colors">
                <Star className="w-3 h-3 fill-amber-400" /> Recommended
              </button>
              {hasSelection && (
                <button onClick={reset} className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-gray-300 transition-colors">
                  <RotateCcw className="w-3 h-3" /> Reset
                </button>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {emblem.tiers.map((tierGroup, tIdx) => (
              <div key={tierGroup.tier}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-widest"
                    style={{ background: `${emblem.colorHex}22`, color: emblem.colorHex }}>
                    Tier {tierGroup.tier}
                  </span>
                  {tIdx < emblem.tiers.length - 1 && (
                    <div className="flex-1 h-px" style={{ background: `${emblem.colorHex}22` }} />
                  )}
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {tierGroup.talents.map(talent => (
                    <TalentCard
                      key={talent.name}
                      talent={talent}
                      selected={selected[tierGroup.tier] === talent.name}
                      onToggle={() => toggle(tierGroup.tier, talent.name)}
                      colorHex={emblem.colorHex}
                      lang={lang}
                    />
                  ))}
                </div>
                {tIdx < emblem.tiers.length - 1 && (
                  <div className="flex justify-center mt-2">
                    <div className="w-px h-4" style={{ background: `${emblem.colorHex}44` }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Active Talents — show selected or default recommended */}
        <div>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mb-2">Active Talents</p>
          <div className="space-y-1">
            {(hasSelection ? activeSel : emblem.activeTalents.map(a => ({ name: a.name, desc: a.desc, descEn: a.descEn }))).map((t, i) => t && (
              <div key={i} className="flex items-start gap-2">
                <span className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: emblem.colorHex }} />
                <span className="text-xs font-semibold" style={{ color: emblem.colorHex }}>{t.name}</span>
                <span className="text-xs text-gray-500">- {lang === 'en' && (t as any).descEn ? (t as any).descEn : t.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Base Stats */}
        <div>
          <p className="text-[10px] text-gray-600 uppercase tracking-widest font-semibold mb-1.5">Base Stats</p>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5">
            {emblem.baseStats.map((s, i) => (
              <span key={i} className="text-[11px] text-gray-400">{s}</span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function ArcanaPage() {
  const [filter, setFilter] = useState('All');
  const [lang, setLang] = useState<'id' | 'en'>('id');

  useEffect(() => {
    document.title = 'Panduan Emblem & Talent - Mobile Legends | MLBB Hub';
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute('content', 'Jelajahi talent tree semua emblem Mobile Legends. Pilih talent terbaik per tier dan lihat rekomendasi pro.');
    return () => { document.title = 'MLBB Hub - Mobile Legends: Bang Bang Community Hub'; };
  }, []);

  const { data: emblems, isLoading, error } = useQuery({
    queryKey: ['talents'],
    queryFn: fetchTalents,
    staleTime: 5 * 60 * 1000,
  });

  const FILTERS = ['All', 'Assassin', 'Mage', 'Fighter', 'Tank', 'Marksman', 'Support'];

  const filtered = (emblems || []).filter(e =>
    filter === 'All' || e.name.toLowerCase() === filter.toLowerCase()
  );

  if (isLoading) return (
    <div className="min-h-screen bg-dark-400 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (error) return <div className="text-center text-red-500 py-10">Gagal memuat data emblem</div>;

  return (
    <div className="min-h-screen bg-dark-400 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-white mb-1">Emblem & Talent</h1>
            <p className="text-gray-400 text-sm">Pilih talent terbaik untuk setiap role. Klik talent untuk memilih, ★ = rekomendasi.</p>
          </div>
          <div className="flex rounded-lg overflow-hidden border border-white/10 text-xs shrink-0 mt-1">
            <button onClick={() => setLang('id')} className={`px-3 py-1.5 transition-colors ${lang === 'id' ? 'bg-primary-500 text-white' : 'text-gray-400 hover:text-white'}`}>ID</button>
            <button onClick={() => setLang('en')} className={`px-3 py-1.5 transition-colors ${lang === 'en' ? 'bg-primary-500 text-white' : 'text-gray-400 hover:text-white'}`}>EN</button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wide transition-all border ${
                filter === f
                  ? 'bg-primary-500/20 border-primary-500/50 text-primary-400'
                  : 'border-white/10 text-gray-400 hover:text-white hover:border-white/20'
              }`}
            >
              {f === 'All' ? 'All Emblems' : f}
            </button>
          ))}
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map(emblem => (
            <EmblemCard key={emblem.id} emblem={emblem} lang={lang} />
          ))}
        </div>
      </div>
    </div>
  );
}
