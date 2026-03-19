import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, X, RotateCcw, ChevronLeft, Flame,
  Plus, Check, Swords, Shield, Wind, TreePine, Compass,
  AlertTriangle, Share2, Bookmark, Copy, CheckCheck, Trash2, Zap,
} from 'lucide-react';
import { useHeroes } from '../hooks/useHeroes';
import { useItems } from '../hooks/useItems';
import { Loading } from '../components/ui/Loading';
import type { Item } from '../types/hero';
import type { Hero } from '../types/hero';
import { EMBLEMS } from '../data/mlbbEmblems';
import type { EmblemId } from '../data/mlbbEmblems';

const API_BASE = import.meta.env.DEV ? '' : 'https://mlbbapi.project-n.site';

// ─── Saved build type ──────────────────────────────────────────────────────────
interface SavedBuild {
  id: string;
  name: string;
  heroName: string;
  heroIcon: string;
  itemIcons: string[];
  encoded: string;
  savedAt: string;
}

interface SpellDef {
  name: string;
  icon: string;
  cd: number;
  effect: string;
}

const BATTLE_SPELLS: SpellDef[] = [
  { name: 'Execute',    icon: '/images/spells/Execute.webp',    cd: 90,  effect: 'Deal True Damage to a low-HP nearby enemy hero' },
  { name: 'Retribution',icon: '/images/spells/Retribution.webp',cd: 35, effect: 'Deal True Damage to a nearby creep/monster; reduces jungle damage taken' },
  { name: 'Inspire',    icon: '/images/spells/Inspire.webp',    cd: 75,  effect: '+55% Attack Speed & ignore 8 Physical Defense on basic attacks for 5s' },
  { name: 'Sprint',     icon: '/images/spells/Sprint.webp',     cd: 100, effect: '+30% Move Speed for 5s (decreasing over time)' },
  { name: 'Revitalize', icon: '/images/spells/Revitalize.webp', cd: 75,  effect: 'Create a zone healing yourself & nearby allies for 3s' },
  { name: 'Aegis',      icon: '/images/spells/Aegis.webp',      cd: 75,  effect: 'Grant yourself & a nearby ally a large shield for 3s' },
  { name: 'Petrify',    icon: '/images/spells/Petrify.webp',    cd: 75,  effect: 'Petrify nearby enemies for 0.8s (AOE crowd control)' },
  { name: 'Purify',     icon: '/images/spells/Purify.webp',     cd: 90,  effect: 'Remove all debuffs & become CC-immune for 1.2s' },
  { name: 'Flameshot',  icon: '/images/spells/Flameshot.webp',  cd: 50,  effect: 'Fire a flaming shot dealing Magic Damage & knocking enemies back' },
  { name: 'Flicker',    icon: '/images/spells/Flicker.webp',    cd: 120, effect: 'Instantly blink a short distance in any direction' },
  { name: 'Arrival',    icon: '/images/spells/Arrival.webp',    cd: 75,  effect: 'Channel 3s then teleport to a friendly structure or minion' },
  { name: 'Vengeance',  icon: '/images/spells/Vengeance.webp',  cd: 75,  effect: 'Reflect 35% of damage received as Magic Damage for 3s' },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

function extractPassiveName(desc: string): string | null {
  const m = desc.match(/^Passive\s*-\s*([^\n\r]+)/);
  return m ? m[1].trim() : null;
}

interface EncodedBuild {
  heroId: number;
  items: (number | null)[];
  emblem: EmblemId | null;
  standardTalents: string[];
  coreTalent: string | null;
  spell: string | null;
}

function encodeBuild(
  hero: Hero,
  items: (Item | null)[],
  emblem: EmblemId | null,
  standardTalents: string[],
  coreTalent: string | null,
  spell: string | null,
): string {
  return btoa(JSON.stringify({ heroId: hero.heroId, items: items.map(i => i?.id ?? null), emblem, standardTalents, coreTalent, spell }));
}

function decodeBuild(encoded: string): EncodedBuild | null {
  try { return JSON.parse(atob(encoded)); } catch { return null; }
}

// ─── Stat definitions ─────────────────────────────────────────────────────────

const STAT_INFO: Record<number, { name: string; isPercent: boolean }> = {
  0: { name: 'Physical Attack', isPercent: false },
  1: { name: 'Physical Attack', isPercent: false },
  2: { name: 'Magical Attack', isPercent: false },
  3: { name: 'Physical Defense', isPercent: false },
  4: { name: 'Magical Defense', isPercent: false },
  5: { name: 'Max Health', isPercent: false },
  6: { name: 'Critical Rate', isPercent: true },
  7: { name: 'Physical Pierce', isPercent: true },
  8: { name: 'Magical Pierce', isPercent: true },
  9: { name: 'Physical Lifesteal', isPercent: true },
  10: { name: 'Magical Lifesteal', isPercent: true },
  12: { name: 'Critical Damage', isPercent: true },
  15: { name: 'Movement Speed', isPercent: false },
  16: { name: 'Health Recovery', isPercent: false },
  18: { name: 'Attack Speed', isPercent: true },
  19: { name: 'Cooldown Reduction', isPercent: true },
};

const STAT_ORDER = [1, 2, 5, 3, 4, 6, 12, 7, 8, 18, 9, 10, 19, 15, 16];

function parseEffectValue(valueType: number, value: number): number {
  switch (valueType) {
    case 1: return value;
    case 2: return value / 10000;
    case 3:
    case 4: return value / 100;
    default: return value;
  }
}

function fmtVal(isPercent: boolean, value: number): string {
  const v = value % 1 === 0 ? value.toString() : value.toFixed(1);
  return isPercent ? `+${v}%` : `+${v}`;
}

// ─── Item categories ───────────────────────────────────────────────────────────

const ITEM_CATEGORIES = [
  { id: 0, label: 'Equipment', Icon: null },
  { id: 1, label: 'Physical', Icon: Swords },
  { id: 2, label: 'Magical', Icon: Flame },
  { id: 3, label: 'Defense', Icon: Shield },
  { id: 4, label: 'Movement', Icon: Wind },
  { id: 5, label: 'Jungling', Icon: TreePine },
  { id: 7, label: 'Roaming', Icon: Compass },
] as const;

const ITEM_TYPE_RING: Record<number, string> = {
  1: 'ring-orange-400/70',
  2: 'ring-purple-400/70',
  3: 'ring-sky-400/70',
  4: 'ring-green-400/70',
  5: 'ring-lime-400/70',
  7: 'ring-teal-400/70',
};

const ROLES = ['All', 'Tank', 'Fighter', 'Assassin', 'Mage', 'Marksman', 'Support'];

// ─── Main Component ────────────────────────────────────────────────────────────

export function PlaygroundPage() {
  useEffect(() => {
    document.title = 'Build Playground - Mobile Legends: Bang Bang | MLBB Hub';
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute('content', 'Create and share Mobile Legends: Bang Bang hero builds. Pick items, emblem, talents and battle spell, then save or share your build.');
    return () => { document.title = 'MLBB Hub - Mobile Legends: Bang Bang Community Hub'; };
  }, []);

  const { data: heroesData, isLoading: loadingHeroes } = useHeroes();
  const { data: itemsData, isLoading: loadingItems } = useItems();

  const heroes = useMemo(
    () => (heroesData ? Object.values(heroesData).sort((a, b) => a.name.localeCompare(b.name)) : []),
    [heroesData]
  );

  const [selectedHero, setSelectedHero] = useState<Hero | null>(null);
  const [heroSearch, setHeroSearch] = useState('');
  const [heroRole, setHeroRole] = useState('All');
  const [buildItems, setBuildItems] = useState<(Item | null)[]>(Array(6).fill(null));

  const [itemSlot, setItemSlot] = useState<number | null>(null);

  // MLBB-specific build state
  const [selectedEmblem, setSelectedEmblem] = useState<EmblemId | null>(null);
  const [standardTalents, setStandardTalents] = useState<string[]>([]);
  const [coreTalent, setCoreTalent] = useState<string | null>(null);
  const [selectedSpell, setSelectedSpell] = useState<string | null>(null);

  const [shareCopied, setShareCopied] = useState(false);
  const [savedBuilds, setSavedBuilds] = useState<SavedBuild[]>(() => {
    try { return JSON.parse(localStorage.getItem('mlbb-playground-builds') ?? '[]'); } catch { return []; }
  });
  const [saveToast, setSaveToast] = useState(false);
  const [pendingBuild] = useState<string | null>(() => new URLSearchParams(window.location.search).get('build'));

  function pickHero(hero: Hero) {
    setSelectedHero(hero);
    if (itemsData && hero.recommendedEquipment?.length) {
      const newItems: (Item | null)[] = Array(6).fill(null);
      hero.recommendedEquipment.slice(0, 6).forEach((eq, i) => {
        newItems[i] = itemsData.find(item => item.id === eq.id) ?? null;
      });
      setBuildItems(newItems);
    } else {
      setBuildItems(Array(6).fill(null));
    }
    setSelectedEmblem(null);
    setStandardTalents([]);
    setCoreTalent(null);
    setSelectedSpell(null);
  }

  function resetBuild() {
    setBuildItems(Array(6).fill(null));
    setSelectedEmblem(null);
    setStandardTalents([]);
    setCoreTalent(null);
    setSelectedSpell(null);
  }

  // ── Load build from URL ────────────────────────────────────────────────────
  useEffect(() => {
    if (!pendingBuild || !heroesData || !itemsData) return;
    const decoded = decodeBuild(pendingBuild);
    if (!decoded) return;
    const hero = Object.values(heroesData).find(h => h.heroId === decoded.heroId);
    if (!hero) return;
    const newItems = decoded.items.map((id: number | null) => id ? (itemsData.find(i => i.id === id) ?? null) : null);
    setSelectedHero(hero);
    setBuildItems(newItems);
    setSelectedEmblem(decoded.emblem ?? null);
    setStandardTalents(decoded.standardTalents ?? []);
    setCoreTalent(decoded.coreTalent ?? null);
    setSelectedSpell(decoded.spell ?? null);
    window.history.replaceState({}, '', window.location.pathname);
  }, [pendingBuild, heroesData, itemsData]);

  // ── Passive conflict detection ─────────────────────────────────────────────
  const passiveConflicts = useMemo(() => {
    const selected = buildItems.filter(Boolean) as Item[];
    const groups: Record<string, Item[]> = {};
    for (const item of selected) {
      for (const ps of item.passiveSkills ?? []) {
        const name = extractPassiveName(ps.description);
        if (!name) continue;
        if (!groups[name]) groups[name] = [];
        if (!groups[name].find(i => i.id === item.id)) groups[name].push(item);
      }
    }
    return Object.entries(groups).filter(([, its]) => its.length > 1).map(([name, its]) => ({ name, items: its }));
  }, [buildItems]);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const acc: Record<number, number> = {};
    for (const item of buildItems) {
      if (!item) continue;
      for (const e of item.effects ?? []) {
        const et = e.effectType === 0 ? 1 : e.effectType;
        acc[et] = (acc[et] ?? 0) + parseEffectValue(e.valueType, e.value);
      }
    }
    return acc;
  }, [buildItems]);

  const totalGold = useMemo(
    () => buildItems.reduce((s, item) => s + (item?.price ?? 0), 0),
    [buildItems]
  );

  // ── Save / Share ───────────────────────────────────────────────────────────
  const handleSave = useCallback(() => {
    if (!selectedHero) return;
    const build: SavedBuild = {
      id: crypto.randomUUID(),
      name: `${selectedHero.name} Build`,
      heroName: selectedHero.name,
      heroIcon: selectedHero.icon,
      itemIcons: buildItems.filter(Boolean).map(i => i!.icon),
      encoded: encodeBuild(selectedHero, buildItems, selectedEmblem, standardTalents, coreTalent, selectedSpell),
      savedAt: new Date().toISOString(),
    };
    const updated = [...savedBuilds, build];
    setSavedBuilds(updated);
    localStorage.setItem('mlbb-playground-builds', JSON.stringify(updated));
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2000);
  }, [selectedHero, buildItems, selectedEmblem, standardTalents, coreTalent, selectedSpell, savedBuilds]);

  const handleShare = useCallback(async () => {
    if (!selectedHero) return;
    const encoded = encodeBuild(selectedHero, buildItems, selectedEmblem, standardTalents, coreTalent, selectedSpell);
    const url = `${window.location.origin}/playground?build=${encoded}`;
    await navigator.clipboard.writeText(url);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  }, [selectedHero, buildItems, selectedEmblem, standardTalents, coreTalent, selectedSpell]);

  const deleteSavedBuild = useCallback((id: string) => {
    const updated = savedBuilds.filter(b => b.id !== id);
    setSavedBuilds(updated);
    localStorage.setItem('mlbb-playground-builds', JSON.stringify(updated));
  }, [savedBuilds]);

  const loadSavedBuild = useCallback((build: SavedBuild) => {
    if (!heroesData || !itemsData) return;
    const decoded = decodeBuild(build.encoded);
    if (!decoded) return;
    const hero = Object.values(heroesData).find(h => h.heroId === decoded.heroId);
    if (!hero) return;
    const newItems = decoded.items.map((id: number | null) => id ? (itemsData.find(i => i.id === id) ?? null) : null);
    setSelectedHero(hero);
    setBuildItems(newItems);
    setSelectedEmblem(decoded.emblem ?? null);
    setStandardTalents(decoded.standardTalents ?? []);
    setCoreTalent(decoded.coreTalent ?? null);
    setSelectedSpell(decoded.spell ?? null);
  }, [heroesData, itemsData]);

  function toggleStandardTalent(name: string) {
    setStandardTalents(prev =>
      prev.includes(name) ? prev.filter(t => t !== name) : [...prev, name]
    );
  }

  if (loadingHeroes || loadingItems) return <Loading />;

  const filteredHeroes = heroes.filter(h => {
    const matchSearch = !heroSearch || h.name.toLowerCase().includes(heroSearch.toLowerCase());
    const matchRole = heroRole === 'All' || h.role === heroRole;
    return matchSearch && matchRole;
  });

  const currentEmblem = selectedEmblem ? (EMBLEMS.find(e => e.id === selectedEmblem) ?? null) : null;

  return (
    <div className="min-h-screen bg-dark-400">
      {/* Page Header */}
      <div className="border-b border-white/5 bg-dark-300/40">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-display font-bold text-white">Hero Build Playground</h1>
              <p className="text-gray-400 text-sm mt-0.5">Pilih hero, atur item, emblem & battle spell</p>
            </div>
            {selectedHero && (
              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={resetBuild} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors px-2 py-1">
                  <RotateCcw className="w-3.5 h-3.5" /> Reset
                </button>
                <button onClick={() => { setSelectedHero(null); resetBuild(); }} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors px-2 py-1">
                  <ChevronLeft className="w-3.5 h-3.5" /> Ganti Hero
                </button>
                <div className="w-px h-4 bg-white/10" />
                <button
                  onClick={handleSave}
                  className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 hover:text-white transition-all"
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  {saveToast ? 'Tersimpan!' : 'Simpan'}
                </button>
                <button
                  onClick={handleShare}
                  className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-primary-500/20 border border-primary-500/30 hover:bg-primary-500/30 text-primary-300 transition-all"
                >
                  {shareCopied ? <CheckCheck className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                  {shareCopied ? 'Link disalin!' : 'Share'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8">
        {!selectedHero ? (
          // ── HERO SELECTION ──────────────────────────────────────────────────
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            {/* Saved builds */}
            {savedBuilds.length > 0 && (
              <div className="mb-6">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Bookmark className="w-3 h-3" /> Build Tersimpan
                </p>
                <div className="flex gap-3 flex-wrap">
                  {savedBuilds.map(build => (
                    <div key={build.id} className="group flex items-center gap-2.5 p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:border-white/[0.16] transition-all min-w-0">
                      <img src={build.heroIcon} alt={build.heroName} className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate max-w-[120px]">{build.name}</p>
                        <div className="flex gap-0.5 mt-1">
                          {build.itemIcons.slice(0, 4).map((icon, i) => (
                            <img key={i} src={icon} alt="" className="w-4 h-4 rounded object-cover" />
                          ))}
                          {build.itemIcons.length > 4 && <span className="text-[10px] text-gray-600 ml-0.5">+{build.itemIcons.length - 4}</span>}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 ml-1">
                        <button onClick={() => loadSavedBuild(build)} className="text-[10px] text-primary-400 hover:text-primary-300 font-semibold transition-colors">Load</button>
                        <button onClick={() => deleteSavedBuild(build.id)} className="text-[10px] text-gray-600 hover:text-red-400 transition-colors"><Trash2 className="w-3 h-3" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-3 mb-5">
              <div className="relative min-w-[180px] flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type="text" value={heroSearch} onChange={e => setHeroSearch(e.target.value)}
                  placeholder="Cari hero..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-white/20"
                />
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {ROLES.map(r => (
                  <button key={r} onClick={() => setHeroRole(r)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${heroRole === r ? 'bg-primary-500 text-white' : 'bg-white/5 text-white/40 hover:text-white/70'}`}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-2">
              {filteredHeroes.map(hero => (
                <motion.button key={hero.heroId} onClick={() => pickHero(hero)}
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-white/[0.04] border border-white/[0.07] hover:bg-white/[0.09] hover:border-white/[0.18] transition-all group">
                  <div className="w-full aspect-square overflow-hidden rounded-lg">
                    <img src={hero.icon} alt={hero.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" loading="lazy" />
                  </div>
                  <span className="text-[10px] text-white/50 font-medium truncate w-full text-center leading-tight">{hero.name}</span>
                </motion.button>
              ))}
              {filteredHeroes.length === 0 && (
                <div className="col-span-full py-16 text-center text-gray-600 text-sm">Tidak ada hero yang ditemukan</div>
              )}
            </div>
          </motion.div>
        ) : (
          // ── BUILD EDITOR ────────────────────────────────────────────────────
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
            {/* Left */}
            <div className="space-y-6">
              {/* Hero banner */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
                <img src={selectedHero.icon} alt={selectedHero.name} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                <div className="min-w-0">
                  <h2 className="text-xl font-bold text-white truncate">{selectedHero.name}</h2>
                  <p className="text-sm text-gray-400">{selectedHero.role} · {selectedHero.lane}</p>
                </div>
              </div>

              {/* Items */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Items</h3>
                  {totalGold > 0 && <span className="text-xs text-amber-400 font-semibold">{totalGold.toLocaleString()} Gold</span>}
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                  {buildItems.map((item, i) => (
                    <div key={i} className="flex flex-col gap-1">
                      <div onClick={() => setItemSlot(i)}
                        className={`group relative aspect-square rounded-xl border-2 transition-all overflow-hidden cursor-pointer ${item ? 'border-white/20 bg-dark-300 hover:border-white/35' : 'border-dashed border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]'}`}>
                        {item ? (
                          <>
                            <img src={item.icon} alt={item.name} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="text-white text-[10px] font-semibold">Ganti</span>
                            </div>
                            <button
                              onClick={e => { e.stopPropagation(); const n = [...buildItems]; n[i] = null; setBuildItems(n); }}
                              className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80">
                              <X className="w-3 h-3 text-white" />
                            </button>
                          </>
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Plus className="w-5 h-5 text-white/20" />
                          </div>
                        )}
                      </div>
                      {item && <p className="text-[9px] text-gray-600 text-center truncate leading-tight px-0.5">{item.name}</p>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Passive conflict warning */}
              {passiveConflicts.length > 0 && (
                <div className="space-y-1.5">
                  {passiveConflicts.map(({ name, items }) => (
                    <div key={name} className="flex items-start gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs font-semibold text-red-300">Passive «{name}» tidak stack</span>
                        <span className="text-xs text-red-400/60 ml-1.5">{items.map(i => i.name).join(' + ')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Emblem */}
              <div className="rounded-2xl bg-white/[0.03] border border-white/[0.07] p-4 space-y-4">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Emblem</h3>

                {/* Emblem type selector */}
                <div className="flex flex-wrap gap-2">
                  {EMBLEMS.map(emb => {
                    const active = selectedEmblem === emb.id;
                    return (
                      <button
                        key={emb.id}
                        onClick={() => { setSelectedEmblem(emb.id); setStandardTalents([]); setCoreTalent(null); }}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all border"
                        style={
                          active
                            ? { background: emb.bg, borderColor: emb.border, color: emb.color }
                            : { background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)', color: 'rgba(156,163,175,1)' }
                        }
                      >
                        <img src={emb.icon} alt={emb.name} className="w-6 h-6 object-contain" />
                        {emb.name}
                      </button>
                    );
                  })}
                  {selectedEmblem && (
                    <button
                      onClick={() => { setSelectedEmblem(null); setStandardTalents([]); setCoreTalent(null); }}
                      className="px-2 py-2 rounded-xl text-xs text-gray-600 hover:text-gray-400 border border-white/[0.06] transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Emblem Attributes */}
                {currentEmblem && (
                  <div className="flex flex-wrap gap-1.5">
                    {currentEmblem.attrs.map(a => (
                      <span key={a} className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                        style={{ background: currentEmblem.bg, color: currentEmblem.color, border: `1px solid ${currentEmblem.border}` }}>
                        {a}
                      </span>
                    ))}
                  </div>
                )}

                {/* Standard Talents */}
                {currentEmblem && (
                  <div className="space-y-2">
                    <p className="text-[10px] uppercase tracking-widest text-gray-600">Standard Talents</p>
                    <div className="grid grid-cols-2 gap-2">
                      {currentEmblem.standard.map(talent => {
                        const active = standardTalents.includes(talent.name);
                        return (
                          <button
                            key={talent.name}
                            onClick={() => toggleStandardTalent(talent.name)}
                            className="flex flex-col gap-2 p-3 rounded-xl text-left transition-all border"
                            style={
                              active
                                ? { background: currentEmblem.bg, borderColor: currentEmblem.border }
                                : { background: 'rgba(255,255,255,0.025)', borderColor: 'rgba(255,255,255,0.07)' }
                            }
                          >
                            <div className="flex items-center gap-2">
                              <img src={`${API_BASE}${talent.icon}`} alt={talent.name}
                                className="w-9 h-9 object-contain rounded-lg shrink-0"
                                style={active ? { filter: `drop-shadow(0 0 5px ${currentEmblem.color}90)` } : { filter: 'grayscale(0.3)' }} />
                              <div className="min-w-0">
                                <p className="text-xs font-semibold leading-tight"
                                  style={{ color: active ? currentEmblem.color : 'rgba(209,213,219,1)' }}>
                                  {talent.name}
                                </p>
                                <p className="text-[10px] leading-tight mt-0.5 line-clamp-2"
                                  style={{ color: active ? `${currentEmblem.color}aa` : 'rgba(107,114,128,1)' }}>
                                  {talent.effect}
                                </p>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Core Talent */}
                {currentEmblem && (
                  <div className="space-y-2">
                    <p className="text-[10px] uppercase tracking-widest text-gray-600">
                      Core Talent {currentEmblem.core.length > 1 && <span className="text-gray-700">— pick 1</span>}
                    </p>
                    <div className={`grid gap-2 ${currentEmblem.core.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                      {currentEmblem.core.map(talent => {
                        const active = coreTalent === talent.name;
                        return (
                          <button
                            key={talent.name}
                            onClick={() => setCoreTalent(active ? null : talent.name)}
                            className="flex flex-col gap-2 p-3 rounded-xl text-left transition-all border"
                            style={
                              active
                                ? { background: `${currentEmblem.color}20`, borderColor: currentEmblem.color }
                                : { background: 'rgba(255,255,255,0.025)', borderColor: 'rgba(255,255,255,0.07)' }
                            }
                          >
                            <div className="flex items-center gap-2">
                              <div className="relative shrink-0">
                                <img src={`${API_BASE}${talent.icon}`} alt={talent.name}
                                  className="w-9 h-9 object-contain rounded-lg"
                                  style={active ? { filter: `drop-shadow(0 0 6px ${currentEmblem.color})` } : { filter: 'grayscale(0.3)' }} />
                                {/* "Signature" badge */}
                                {currentEmblem.core.length === 1 && (
                                  <span className="absolute -top-1 -right-1 text-[8px] font-black px-1 rounded-sm"
                                    style={{ background: currentEmblem.color, color: '#fff' }}>SIG</span>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold leading-tight"
                                  style={{ color: active ? currentEmblem.color : 'rgba(209,213,219,1)' }}>
                                  {talent.name}
                                </p>
                                <p className="text-[10px] leading-tight mt-0.5 line-clamp-3"
                                  style={{ color: active ? `${currentEmblem.color}aa` : 'rgba(107,114,128,1)' }}>
                                  {talent.effect}
                                </p>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {!selectedEmblem && (
                  <p className="text-xs text-gray-700 italic">Pilih emblem untuk melihat talents</p>
                )}
              </div>

              {/* Battle Spell */}
              <div className="rounded-2xl bg-white/[0.03] border border-white/[0.07] p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-3.5 h-3.5 text-gray-500" />
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Battle Spell</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {BATTLE_SPELLS.map(spell => {
                    const active = selectedSpell === spell.name;
                    return (
                      <button
                        key={spell.name}
                        onClick={() => setSelectedSpell(active ? null : spell.name)}
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all border ${
                          active
                            ? 'bg-primary-500/15 border-primary-500/40'
                            : 'bg-white/[0.03] border-white/[0.07] hover:border-white/20 hover:bg-white/[0.06]'
                        }`}
                      >
                        <img
                          src={`${API_BASE}${spell.icon}`}
                          alt={spell.name}
                          className={`w-9 h-9 rounded-lg object-cover shrink-0 ${active ? 'ring-2 ring-primary-400/60' : ''}`}
                        />
                        <div className="min-w-0">
                          <p className={`text-xs font-semibold truncate ${active ? 'text-primary-300' : 'text-gray-300'}`}>
                            {spell.name}
                          </p>
                          <p className="text-[10px] text-gray-600 leading-tight line-clamp-2 mt-0.5">
                            {spell.effect}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right: Stats */}
            <div className="lg:sticky lg:top-20 h-fit space-y-3">
              {/* Build summary card */}
              {(selectedEmblem || selectedSpell || standardTalents.length > 0 || coreTalent) && (
                <div className="rounded-2xl bg-dark-300 border border-white/10 p-4 space-y-3">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Build Summary</h3>

                  {currentEmblem && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-600 w-16 shrink-0">Emblem</span>
                      <span className="text-xs font-bold" style={{ color: currentEmblem.color }}>{currentEmblem.name}</span>
                    </div>
                  )}

                  {(standardTalents.length > 0 || coreTalent) && currentEmblem && (
                    <div className="flex items-start gap-2">
                      <span className="text-[10px] text-gray-600 w-16 shrink-0 mt-1">Talents</span>
                      <div className="flex flex-col gap-1.5">
                        {[...standardTalents, ...(coreTalent ? [coreTalent] : [])].map(name => {
                          const talent = [...currentEmblem.standard, ...currentEmblem.core].find(t => t.name === name);
                          return talent ? (
                            <div key={name} className="flex items-center gap-1.5">
                              <img src={`${API_BASE}${talent.icon}`} alt={name} className="w-4 h-4 object-contain" />
                              <span className="text-xs text-gray-300">{name}</span>
                            </div>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}

                  {selectedSpell && (() => {
                    const sp = BATTLE_SPELLS.find(s => s.name === selectedSpell);
                    return (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-600 w-16 shrink-0">Spell</span>
                        {sp && <img src={`${API_BASE}${sp.icon}`} alt={sp.name} className="w-5 h-5 rounded object-cover" />}
                        <span className="text-xs font-semibold text-primary-300">{selectedSpell}</span>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Item stats */}
              <div className="rounded-2xl bg-dark-300 border border-white/10 p-5">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Total Stat Build</h3>

                {Object.keys(stats).length === 0 ? (
                  <p className="text-sm text-gray-600 text-center py-10">Tambah item untuk melihat stat</p>
                ) : (
                  <div>
                    {STAT_ORDER.filter(et => stats[et] != null).map(et => {
                      const info = STAT_INFO[et];
                      if (!info) return null;
                      return (
                        <div key={et} className="flex items-center justify-between py-2 border-b border-white/[0.05] last:border-0">
                          <span className="text-xs text-gray-400">{info.name}</span>
                          <span className={`text-sm font-bold tabular-nums ${info.isPercent ? 'text-amber-300' : 'text-white'}`}>{fmtVal(info.isPercent, stats[et])}</span>
                        </div>
                      );
                    })}
                    {Object.entries(stats).filter(([et]) => !STAT_INFO[Number(et)]).map(([et, val]) => (
                      <div key={et} className="flex items-center justify-between py-2 border-b border-white/[0.05] last:border-0">
                        <span className="text-xs text-gray-600">Stat #{et}</span>
                        <span className="text-sm font-bold text-gray-500">+{(val as number) % 1 === 0 ? val : (val as number).toFixed(1)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {totalGold > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/[0.08] flex items-center justify-between">
                    <span className="text-xs text-gray-500">Total Gold</span>
                    <span className="text-sm font-bold text-amber-400">{totalGold.toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* Share button */}
              <button
                onClick={handleShare}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] text-gray-400 hover:text-white text-xs font-medium transition-all"
              >
                {shareCopied ? <CheckCheck className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                {shareCopied ? 'Link disalin!' : 'Salin link build'}
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* ── Item Picker ──────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {itemSlot !== null && itemsData && (
          <ItemPickerOverlay
            itemsData={itemsData}
            buildItems={buildItems}
            onSelect={item => {
              const n = [...buildItems];
              n[itemSlot] = item;
              setBuildItems(n);
              setItemSlot(null);
            }}
            onClose={() => setItemSlot(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Item Picker ───────────────────────────────────────────────────────────────

function ItemPickerOverlay({
  itemsData, buildItems, onSelect, onClose,
}: {
  itemsData: Item[];
  buildItems: (Item | null)[];
  onSelect: (item: Item) => void;
  onClose: () => void;
}) {
  const [category, setCategory] = useState<number>(0);
  const [search, setSearch] = useState('');
  const [previewItem, setPreviewItem] = useState<Item | null>(null);

  const tieredItems = useMemo(() => {
    const base = itemsData
      .filter(item => category === 0 || item.type === category)
      .filter(item => !search || item.name.toLowerCase().includes(search.toLowerCase()));

    const groups: Record<number, { name: string; items: Item[] }> = {};
    for (const item of base) {
      if (!groups[item.level]) groups[item.level] = { name: item.levelName || `Level ${item.level}`, items: [] };
      groups[item.level].items.push(item);
    }
    return Object.entries(groups)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([, v]) => v);
  }, [itemsData, category, search]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: 'linear-gradient(160deg, #091828 0%, #0b1e35 100%)' }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 flex-shrink-0 border-b"
        style={{ borderColor: 'rgba(56,100,160,0.4)', background: 'rgba(5,14,28,0.7)' }}
      >
        <button onClick={onClose} className="p-1.5 rounded-lg text-sky-300/60 hover:text-white transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-white font-bold text-lg tracking-wide">Equipment</h2>

        <div className="relative flex-1 max-w-64 ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-300/40" />
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Cari..."
            autoFocus
            className="w-full pl-9 pr-4 py-1.5 rounded-lg text-sm text-white placeholder-sky-300/30 focus:outline-none"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(56,120,200,0.3)' }}
          />
        </div>

        <button onClick={onClose} className="p-1.5 rounded-lg text-sky-300/60 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar — categories */}
        <div
          className="w-28 shrink-0 flex flex-col py-1 overflow-y-auto"
          style={{ background: 'rgba(5,12,25,0.8)', borderRight: '1px solid rgba(30,70,130,0.5)' }}
        >
          {ITEM_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className="relative px-4 py-3 text-sm font-medium text-left transition-all flex items-center gap-2"
              style={{
                background: category === cat.id ? 'rgba(29,127,212,0.6)' : undefined,
                color: category === cat.id ? '#fff' : 'rgba(147,197,253,0.5)',
              }}
            >
              {category === cat.id && (
                <span className="absolute right-0 inset-y-0 w-0.5 bg-sky-400 rounded-l" />
              )}
              {cat.Icon && <cat.Icon className="w-3.5 h-3.5 shrink-0 opacity-80" />}
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Center — item grid */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {tieredItems.length === 0 ? (
            <p className="text-center text-sky-300/30 text-sm py-20">Tidak ada item yang ditemukan</p>
          ) : (
            tieredItems.map(({ name: tierName, items }) => (
              <div key={tierName} className="mb-7">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px flex-1" style={{ background: 'rgba(180,130,40,0.3)' }} />
                  <span className="text-sm font-bold tracking-wider" style={{ color: '#e8c060' }}>{tierName}</span>
                  <div className="h-px flex-1" style={{ background: 'rgba(180,130,40,0.3)' }} />
                </div>
                <div className="flex flex-wrap gap-3">
                  {items.map(item => {
                    const isSelected = previewItem?.id === item.id;
                    const ringClass = ITEM_TYPE_RING[item.type] ?? 'ring-slate-500/50';
                    return (
                      <button
                        key={item.id}
                        onClick={() => setPreviewItem(item)}
                        onDoubleClick={() => onSelect(item)}
                        title={item.name}
                        className={`relative rounded-full overflow-hidden ring-2 ring-offset-2 transition-all duration-150 ${
                          isSelected
                            ? 'ring-white scale-110 ring-offset-[#091828]'
                            : `${ringClass} ring-offset-[#091828] hover:scale-105 hover:ring-sky-400/70`
                        }`}
                        style={{ width: 60, height: 60 }}
                      >
                        <img src={item.icon} alt={item.name} className="w-full h-full object-cover" />
                        {isSelected && (
                          <div className="absolute inset-0 bg-white/20 flex items-center justify-center">
                            <Check className="w-4 h-4 text-white drop-shadow" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
          <p className="text-center text-sky-300/20 text-[11px] pb-4">Double-click untuk langsung pilih</p>
        </div>

        {/* Right — detail panel */}
        <div
          className="hidden lg:flex flex-col w-64 shrink-0 overflow-y-auto p-4"
          style={{ background: 'rgba(5,12,25,0.7)', borderLeft: '1px solid rgba(30,70,130,0.4)' }}
        >
          {previewItem ? (
            <ItemDetailPanel item={previewItem} onSelect={onSelect} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center gap-3">
              <Swords className="w-8 h-8 text-sky-800/50" />
              <p className="text-sky-300/30 text-sm">Klik item untuk detail</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom — current build slots */}
      <div
        className="flex-shrink-0 px-4 py-3 flex items-center justify-center gap-3 border-t"
        style={{ background: 'rgba(5,12,25,0.85)', borderColor: 'rgba(30,70,130,0.4)' }}
      >
        {buildItems.map((item, i) => (
          <div
            key={i}
            className="rounded-full overflow-hidden ring-1 ring-sky-800/50"
            style={{ width: 44, height: 44, background: 'rgba(20,40,80,0.8)' }}
          >
            {item && <img src={item.icon} alt={item.name} className="w-full h-full object-cover" />}
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Item Detail Panel ─────────────────────────────────────────────────────────

function ItemDetailPanel({ item, onSelect }: { item: Item; onSelect: (item: Item) => void }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <img src={item.icon} alt={item.name} className="w-16 h-16 rounded-xl object-cover ring-2 ring-sky-700/50 shrink-0" />
        <div className="min-w-0">
          <h3 className="font-bold text-white text-sm leading-tight">{item.name}</h3>
          <p className="font-semibold text-sm mt-0.5" style={{ color: '#e8c060' }}>{item.price.toLocaleString()} Gold</p>
          <span className="text-[11px] text-sky-300/50">{item.typeName} · Lv.{item.level}</span>
        </div>
      </div>

      {item.effects?.length > 0 && (
        <div className="mb-4">
          <p className="text-[10px] uppercase tracking-widest mb-2 text-sky-400/50">Stat</p>
          {item.effects.map((e, i) => {
            const info = STAT_INFO[e.effectType];
            const val = parseEffectValue(e.valueType, e.value);
            return (
              <div key={i} className="flex justify-between items-center py-1.5 border-b border-sky-900/30 last:border-0">
                <span className="text-xs text-sky-200/60">{info?.name ?? `Stat #${e.effectType}`}</span>
                <span className={`text-xs font-bold tabular-nums ${info?.isPercent ? 'text-amber-300' : 'text-white'}`}>
                  {fmtVal(info?.isPercent ?? false, val)}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {item.passiveSkills?.length > 0 && (
        <div className="mb-4">
          <p className="text-[10px] uppercase tracking-widest mb-2 text-sky-400/50">Passive</p>
          {item.passiveSkills.map((ps, i) => (
            <p key={i} className="text-[11px] text-sky-200/50 leading-relaxed rounded-lg p-2.5 mb-1.5"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(56,100,160,0.3)' }}>
              {ps.description}
            </p>
          ))}
        </div>
      )}

      {item.buildsFrom?.length > 0 && (
        <div className="mb-5">
          <p className="text-[10px] uppercase tracking-widest mb-2 text-sky-400/50">Resep</p>
          <div className="flex flex-wrap gap-2">
            {item.buildsFrom.map(ref => (
              <div key={ref.id} className="flex items-center gap-1.5 rounded-lg px-2 py-1.5"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(56,100,160,0.3)' }}>
                <img src={ref.icon} alt={ref.name} className="w-7 h-7 rounded-md object-cover" />
                <div>
                  <p className="text-[10px] text-sky-200/50 font-medium">{ref.name}</p>
                  {ref.price && <p className="text-[10px]" style={{ color: '#e8c060' }}>{ref.price.toLocaleString()}g</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={() => onSelect(item)}
        className="w-full py-2.5 rounded-xl text-white font-bold text-sm transition-all hover:brightness-110"
        style={{ background: 'linear-gradient(135deg, #1a6faa, #2196f3)' }}
      >
        Pilih Item Ini
      </button>
    </div>
  );
}
