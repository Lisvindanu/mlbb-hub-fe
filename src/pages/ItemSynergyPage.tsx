import { useState, useMemo, useEffect } from 'react';
import { AlertTriangle, CheckCircle, X, Search, Info, Layers } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchAllItems } from '../api/items';
import type { Item } from '../types/hero';

const TYPE_FILTERS = ['All', 'Physical', 'Magical', 'Defense', 'Boots', 'Jungling', 'Roaming'] as const;
const MAX_ITEMS = 6;

function extractPassiveName(description: string): string | null {
  const m = description.match(/^(?:Unique\s+)?Passive\s*-\s*([^:\n\r]+)/i);
  return m ? m[1].trim() : null;
}

function getConflicts(items: Item[]) {
  const groups: Record<string, Item[]> = {};
  for (const item of items) {
    for (const ps of item.passiveSkills ?? []) {
      const name = extractPassiveName(ps.description);
      if (!name) continue;
      if (!groups[name]) groups[name] = [];
      if (!groups[name].find(i => i.id === item.id)) groups[name].push(item);
    }
  }
  return Object.entries(groups)
    .filter(([, its]) => its.length > 1)
    .map(([name, its]) => ({ name, items: its }));
}

// Curated community-known conflict pairs (different passive names but same effect)
const CURATED_CONFLICTS: { items: string[]; reason: string; severity: 'hard' | 'soft' }[] = [
  {
    items: ['Endless Battle', 'Thunder Belt'],
    reason: 'Keduanya memberi True Damage setelah menggunakan skill — efeknya tidak akan stack.',
    severity: 'hard',
  },
  {
    items: ['Berserker\'s Fury', 'Golden Staff'],
    reason: 'Golden Staff mengubah Critical Rate menjadi Attack Speed, sehingga passive crit Berserker\'s Fury tidak aktif.',
    severity: 'hard',
  },
  {
    items: ['Enchanted Talisman', 'Demon Shoes'],
    reason: 'Keduanya memberikan Mana Regen — sumber regenerasi mana yang redundan, buang satu slot.',
    severity: 'soft',
  },
  {
    items: ['Wind of Nature', 'Winter Truncheon'],
    reason: 'Keduanya memberikan efek immunity aktif selama 2 detik — tidak bisa aktif bersamaan, pilih salah satu.',
    severity: 'soft',
  },
  {
    items: ['Blade of the Heptaseas', 'Demon Hunter Sword'],
    reason: 'Blade of the Heptaseas butuh 5 detik tanpa damage untuk aktif, sementara Demon Hunter mendorong serangan terus-menerus — playstyle saling bertentangan.',
    severity: 'soft',
  },
  {
    items: ['Athena\'s Shield', 'Radiant Armor'],
    reason: 'Keduanya melindungi dari Magic Damage — redundan, slot lebih baik diisi item lain.',
    severity: 'soft',
  },
];

function getCuratedConflicts(items: Item[]) {
  const names = items.map(i => i.name);
  return CURATED_CONFLICTS.filter(cc =>
    cc.items.every(required => names.includes(required))
  );
}

// Effect categories — items sharing the same category have overlapping/redundant effects
const EFFECT_GROUPS: { name: string; label: string; keywords: RegExp }[] = [
  {
    name: 'anti_heal',
    label: 'Anti-Heal / Anti-Regen',
    keywords: /reduc(e|ing|es)\s+(healing|hp\s*regen|regeneration)|heal.*reduc|regen.*reduc|grievous|healing\s+effect.*reduc/i,
  },
  {
    name: 'slow',
    label: 'Movement Slow',
    keywords: /reduc(e|es|ing)\s+movement\s+speed|slow(s)?\s+(enemy|target|enemies|nearby)/i,
  },
  {
    name: 'shield_reduction',
    label: 'Shield Reduction',
    keywords: /reduc(e|es|ing)\s+shield|shield.*weaken/i,
  },
  {
    name: 'attack_speed_reduction',
    label: 'Attack Speed Reduction',
    keywords: /reduc(e|es|ing)\s+attack\s+speed/i,
  },
  {
    name: 'magic_defense_reduction',
    label: 'Magic Defense Reduction',
    keywords: /reduc(e|es|ing)\s+magic\s+defense|magic\s+defense.*reduc/i,
  },
  {
    name: 'physical_defense_reduction',
    label: 'Physical Defense Reduction',
    keywords: /reduc(e|es|ing)\s+physical\s+defense|armor.*reduc/i,
  },
];

function getSimilarEffects(items: Item[]) {
  const result: { groupLabel: string; items: Item[] }[] = [];
  for (const group of EFFECT_GROUPS) {
    const matched: Item[] = [];
    for (const item of items) {
      const allDesc = (item.passiveSkills ?? []).map(ps => ps.description).join(' ');
      if (group.keywords.test(allDesc) && !matched.find(i => i.id === item.id)) {
        matched.push(item);
      }
    }
    if (matched.length >= 2) {
      result.push({ groupLabel: group.label, items: matched });
    }
  }
  return result;
}

function ItemCard({ item, selected, onClick }: { item: Item; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={item.name}
      className={`relative flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition-all duration-150
        ${selected
          ? 'border-primary-500 bg-primary-500/15 shadow-[0_0_12px_rgba(var(--color-primary-500),0.3)]'
          : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]'
        }`}
    >
      {selected && (
        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-primary-500 flex items-center justify-center">
          <CheckCircle className="w-3 h-3 text-white" />
        </span>
      )}
      <img src={item.icon} alt={item.name} className="w-10 h-10 rounded-lg object-cover" />
      <span className="text-[10px] text-center text-gray-400 leading-tight line-clamp-2 w-full">{item.name}</span>
    </button>
  );
}

function SelectedSlot({ item, onRemove }: { item: Item; onRemove: () => void }) {
  return (
    <div className="relative group flex flex-col items-center gap-1">
      <div className="relative">
        <img src={item.icon} alt={item.name} className="w-12 h-12 rounded-xl object-cover border border-white/10" />
        <button
          onClick={onRemove}
          className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 w-5 h-5 rounded-full bg-red-500/80 hover:bg-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X className="w-3 h-3 text-white" />
        </button>
      </div>
      <span className="text-[9px] text-gray-500 text-center w-12 leading-tight line-clamp-2">{item.name}</span>
    </div>
  );
}

function EmptySlot() {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="w-12 h-12 rounded-xl border-2 border-dashed border-white/10 flex items-center justify-center">
        <span className="text-white/20 text-lg">+</span>
      </div>
      <span className="text-[9px] text-white/10 text-center w-12">Kosong</span>
    </div>
  );
}

export function ItemSynergyPage() {
  useEffect(() => {
    document.title = 'Item Synergy Guide - Mobile Legends: Bang Bang | MLBB Hub';
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute('content', 'Check item synergy and passive conflicts in Mobile Legends: Bang Bang. Build optimized item sets without unique passive clashes.');
    return () => { document.title = 'MLBB Hub - Mobile Legends: Bang Bang Community Hub'; };
  }, []);

  const { data: allItems = [], isLoading } = useQuery({
    queryKey: ['items'],
    queryFn: fetchAllItems,
  });

  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Item[]>([]);

  const topItems = useMemo(() => allItems.filter(i => i.isTopEquip), [allItems]);

  const filtered = useMemo(() => {
    return topItems.filter(item => {
      const matchType = typeFilter === 'All' || item.typeName === typeFilter;
      const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
      return matchType && matchSearch;
    });
  }, [topItems, typeFilter, search]);

  const conflicts = useMemo(() => getConflicts(selected), [selected]);
  const similarEffects = useMemo(() => getSimilarEffects(selected), [selected]);
  const curatedConflicts = useMemo(() => getCuratedConflicts(selected), [selected]);

  function toggle(item: Item) {
    setSelected(prev => {
      const exists = prev.find(i => i.id === item.id);
      if (exists) return prev.filter(i => i.id !== item.id);
      if (prev.length >= MAX_ITEMS) return prev;
      return [...prev, item];
    });
  }

  return (
    <div className="min-h-screen bg-dark-400 pb-20">
      {/* Header */}
      <div className="border-b border-white/5 bg-dark-400/80 backdrop-blur sticky top-16 z-10">
        <div className="container mx-auto px-4 md:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-white">Pengecekan Synergy Item</h1>
              <p className="text-xs text-gray-500 mt-0.5">Pilih item build kamu dan lihat apakah ada passive yang konflik</p>
            </div>
            {selected.length > 0 && (
              <button
                onClick={() => setSelected([])}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/10 transition-colors"
              >
                <X className="w-3 h-3" /> Reset build
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-6 space-y-6">

        {/* Selected build + warnings */}
        <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4 space-y-4">
          {/* Slot row */}
          <div>
            <p className="text-xs text-gray-500 mb-3 uppercase tracking-wider">
              Build kamu ({selected.length}/{MAX_ITEMS})
            </p>
            <div className="flex items-start gap-3 flex-wrap">
              {Array.from({ length: MAX_ITEMS }).map((_, i) =>
                selected[i]
                  ? <SelectedSlot key={selected[i].id} item={selected[i]} onRemove={() => toggle(selected[i])} />
                  : <EmptySlot key={i} />
              )}
            </div>
          </div>

          {/* Conflict warnings */}
          {selected.length >= 2 && (
            <div className="space-y-2">
              {conflicts.length === 0 && similarEffects.length === 0 && curatedConflicts.length === 0 ? (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-green-500/10 border border-green-500/20">
                  <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                  <span className="text-sm text-green-300">Tidak ada passive yang konflik — build aman!</span>
                </div>
              ) : (
                <>
                  {conflicts.map(({ name, items }) => (
                    <div key={name} className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
                      <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-red-300">
                          Passive «{name}» tidak akan stack
                        </p>
                        <p className="text-xs text-red-400/70 mt-0.5">
                          {items.map(i => i.name).join(' + ')} — punya passive yang sama, hanya satu yang aktif.
                        </p>
                      </div>
                    </div>
                  ))}
                  {curatedConflicts.map(cc => {
                    const isHard = cc.severity === 'hard';
                    return (
                      <div key={cc.items.join('+')} className={`flex items-start gap-2.5 px-3 py-2.5 rounded-xl border ${isHard ? 'bg-orange-500/10 border-orange-500/20' : 'bg-yellow-500/10 border-yellow-500/20'}`}>
                        <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${isHard ? 'text-orange-400' : 'text-yellow-400'}`} />
                        <div>
                          <p className={`text-sm font-semibold ${isHard ? 'text-orange-300' : 'text-yellow-300'}`}>
                            {cc.items.join(' + ')}
                          </p>
                          <p className={`text-xs mt-0.5 ${isHard ? 'text-orange-400/70' : 'text-yellow-400/70'}`}>{cc.reason}</p>
                        </div>
                      </div>
                    );
                  })}
                  {similarEffects.map(({ groupLabel, items }) => (
                    <div key={groupLabel} className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                      <Layers className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-amber-300">
                          Efek serupa: {groupLabel}
                        </p>
                        <p className="text-xs text-amber-400/70 mt-0.5">
                          {items.map(i => i.name).join(' + ')} — efeknya overlap, mungkin tidak perlu dua-duanya.
                        </p>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {selected.length < 2 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/5">
              <Info className="w-3.5 h-3.5 text-gray-500 shrink-0" />
              <span className="text-xs text-gray-500">Pilih minimal 2 item untuk mengecek konflik passive</span>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="space-y-3">
          {/* Type filter chips */}
          <div className="flex items-center gap-2 flex-wrap">
            {TYPE_FILTERS.map(t => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all
                  ${typeFilter === t
                    ? 'bg-primary-500 text-white'
                    : 'bg-white/[0.05] text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <input
              type="text"
              placeholder="Cari item..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-4 py-2 bg-white/[0.05] border border-white/10 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary-500/50"
            />
          </div>
        </div>

        {/* Item grid */}
        {isLoading ? (
          <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-xl bg-white/[0.04] animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            <p className="text-xs text-gray-600">{filtered.length} item</p>
            <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
              {filtered.map(item => (
                <ItemCard
                  key={item.id}
                  item={item}
                  selected={!!selected.find(s => s.id === item.id)}
                  onClick={() => toggle(item)}
                />
              ))}
            </div>
          </>
        )}

        {/* Passive legend */}
        {selected.length > 0 && (
          <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Passive skill dari item yang dipilih</p>
            <div className="space-y-2">
              {selected.flatMap(item =>
                (item.passiveSkills ?? []).map(ps => {
                  const name = extractPassiveName(ps.description);
                  if (!name) return null;
                  const isConflicted = conflicts.some(c => c.name === name);
                  return (
                    <div key={`${item.id}-${ps.id}-${name}`} className={`flex items-start gap-2.5 px-3 py-2 rounded-lg ${isConflicted ? 'bg-red-500/8 border border-red-500/15' : 'bg-white/[0.03]'}`}>
                      <img src={item.icon} alt={item.name} className="w-5 h-5 rounded mt-0.5 shrink-0" />
                      <div>
                        <span className={`text-xs font-semibold ${isConflicted ? 'text-red-300' : 'text-gray-300'}`}>
                          {name}
                          {isConflicted && <span className="ml-1.5 text-[10px] text-red-400 font-normal">⚠ konflik</span>}
                        </span>
                        <p className="text-[11px] text-gray-600 mt-0.5 leading-relaxed line-clamp-2">{ps.description.replace(/\n/g, ' ')}</p>
                      </div>
                    </div>
                  );
                }).filter(Boolean)
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
