import { useState, useMemo, useEffect } from 'react';
import { Search, Filter, Coins, Swords, Sparkles, Shield, Footprints, Trees, Users, List, GitBranch, ArrowRight } from 'lucide-react';
import { useItems } from '../hooks/useItems';
import { Loading } from '../components/ui/Loading';
import { motion } from 'framer-motion';
import type { Item } from '../types/hero';

type ViewMode = 'list' | 'buildtree';

const ITEM_TYPES = [
  { id: 0, name: 'All', icon: Filter },
  { id: 1, name: 'Physical', icon: Swords },
  { id: 2, name: 'Magical', icon: Sparkles },
  { id: 3, name: 'Defense', icon: Shield },
  { id: 4, name: 'Boots', icon: Footprints },
  { id: 5, name: 'Jungling', icon: Trees },
  { id: 7, name: 'Roaming', icon: Users },
];

const ITEM_LEVELS = [
  { id: 0, name: 'All Tiers' },
  { id: 1, name: 'Basic' },
  { id: 2, name: 'Mid-Tier' },
  { id: 3, name: 'Advanced' },
];

export function ItemsPage() {
  useEffect(() => {
    document.title = 'Items Guide - Mobile Legends: Bang Bang | MLBB Hub';
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute('content', 'Complete Mobile Legends: Bang Bang items list. Browse all 114 items with stats, passives, and build recommendations.');
    return () => { document.title = 'MLBB Hub - Mobile Legends: Bang Bang Community Hub'; };
  }, []);

  const { data: items, isLoading, error } = useItems();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState(0);
  const [selectedLevel, setSelectedLevel] = useState(0);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  const filteredItems = useMemo(() => {
    if (!items) return [];

    return items.filter(item => {
      const matchesSearch = !searchQuery ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = selectedType === 0 || item.type === selectedType;
      const matchesLevel = selectedLevel === 0 || item.level === selectedLevel;

      return matchesSearch && matchesType && matchesLevel;
    });
  }, [items, searchQuery, selectedType, selectedLevel]);

  // Group by type
  const groupedItems = useMemo(() => {
    if (selectedType !== 0) {
      return [{ type: selectedType, typeName: ITEM_TYPES.find(t => t.id === selectedType)?.name || '', items: filteredItems }];
    }

    const groups: { type: number; typeName: string; items: Item[] }[] = [];
    ITEM_TYPES.slice(1).forEach(type => {
      const typeItems = filteredItems.filter(item => item.type === type.id);
      if (typeItems.length > 0) {
        groups.push({ type: type.id, typeName: type.name, items: typeItems });
      }
    });
    return groups;
  }, [filteredItems, selectedType]);

  if (isLoading) return <Loading />;
  if (error) return <div className="text-center text-red-500 py-10">Gagal memuat item</div>;

  return (
    <div className="min-h-screen bg-dark-400 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-white mb-1">Equipment</h1>
            <p className="text-gray-400 text-sm">Jelajahi semua {items?.length || 0} item di Mobile Legends: Bang Bang</p>
          </div>

          {/* View Toggle */}
          <div className="flex gap-2 bg-dark-300 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all text-sm ${
                viewMode === 'list'
                  ? 'bg-primary-500 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <List className="w-4 h-4" />
              Semua Item
            </button>
            <button
              onClick={() => setViewMode('buildtree')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all text-sm ${
                viewMode === 'buildtree'
                  ? 'bg-primary-500 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <GitBranch className="w-4 h-4" />
              Pohon Build
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Cari item..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-dark-300 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
            />
          </div>

          {/* Type Filter */}
          <div className="flex flex-wrap gap-2">
            {ITEM_TYPES.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    selectedType === type.id
                      ? 'bg-primary-500 text-white'
                      : 'bg-dark-300 text-gray-400 hover:bg-dark-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {type.name}
                </button>
              );
            })}
          </div>

          {/* Level Filter */}
          <div className="flex flex-wrap gap-2">
            {ITEM_LEVELS.map((level) => (
              <button
                key={level.id}
                onClick={() => setSelectedLevel(level.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedLevel === level.id
                    ? 'bg-amber-500 text-white'
                    : 'bg-dark-300 text-gray-400 hover:bg-dark-200'
                }`}
              >
                {level.name}
              </button>
            ))}
          </div>
        </div>

        {/* Results count */}
        <p className="text-gray-500 mb-4">
          {viewMode === 'list' ? `Menampilkan ${filteredItems.length} item` : 'Pilih item untuk melihat jalur build-nya'}
        </p>

        {/* LIST VIEW */}
        {viewMode === 'list' && groupedItems.map((group) => (
          <div key={group.type} className="mb-8">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2 border-b border-white/10 pb-2">
              {group.typeName}
              <span className="text-sm font-normal text-gray-500">({group.items.length})</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-1">
              {group.items.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="group cursor-pointer py-2 border-b border-white/5 hover:bg-white/5 -mx-2 px-2 rounded transition-colors"
                  onClick={() => setSelectedItem(item)}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative flex-shrink-0">
                      <img src={item.icon} alt={item.name} className="w-10 h-10 rounded-lg object-cover" />
                      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[10px] font-medium text-amber-400 bg-dark-400/90 px-1.5 rounded">
                        {item.price}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-white truncate group-hover:text-primary-400 transition-colors">
                        {item.name}
                      </h3>
                      {item.description && (
                        <p className="text-xs text-gray-500 truncate">{item.description.split('\n')[0]}</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ))}

        {/* BUILD TREE VIEW */}
        {viewMode === 'buildtree' && (
          <div className="space-y-6">
            {/* Advanced Items with build paths */}
            {groupedItems.map((group) => {
              const advancedItems = group.items.filter(i => i.level === 3 && (i.buildsFrom?.length ?? 0) > 0);
              if (advancedItems.length === 0) return null;

              return (
                <div key={group.type} className="mb-8">
                  <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2 border-b border-white/10 pb-2">
                    {group.typeName} - Jalur Build
                  </h2>

                  <div className="space-y-4">
                    {advancedItems.map((item) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-dark-300 rounded-xl p-4 border border-white/5"
                      >
                        {/* Build Path: Components -> Final Item */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Component Items */}
                          {(item.buildsFrom || []).map((comp, idx) => (
                            <div key={comp.id} className="flex items-center gap-2">
                              <div
                                className="flex items-center gap-2 bg-dark-400 rounded-lg px-3 py-2 cursor-pointer hover:bg-dark-200 transition-colors"
                                onClick={() => {
                                  const fullItem = items?.find(i => i.id === comp.id);
                                  if (fullItem) setSelectedItem(fullItem);
                                }}
                              >
                                <img src={comp.icon} alt={comp.name} className="w-8 h-8 rounded" />
                                <div>
                                  <p className="text-sm text-white">{comp.name}</p>
                                  <p className="text-xs text-amber-400">{comp.price}</p>
                                </div>
                              </div>
                              {idx < (item.buildsFrom?.length ?? 0) - 1 && (
                                <span className="text-gray-600">+</span>
                              )}
                            </div>
                          ))}

                          {/* Arrow */}
                          <ArrowRight className="w-5 h-5 text-primary-500 mx-2" />

                          {/* Final Item */}
                          <div
                            className="flex items-center gap-2 bg-primary-500/20 border border-primary-500/30 rounded-lg px-3 py-2 cursor-pointer hover:bg-primary-500/30 transition-colors"
                            onClick={() => setSelectedItem(item)}
                          >
                            <img src={item.icon} alt={item.name} className="w-10 h-10 rounded" />
                            <div>
                              <p className="text-sm font-medium text-white">{item.name}</p>
                              <p className="text-xs text-amber-400">{item.price} Gold</p>
                            </div>
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-xs text-gray-500 mt-2">{item.description}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Item Detail Modal */}
        {selectedItem && (
          <div
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedItem(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-dark-300 rounded-2xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-4 mb-4">
                <img
                  src={selectedItem.icon}
                  alt={selectedItem.name}
                  className="w-20 h-20 rounded-xl"
                />
                <div>
                  <h2 className="text-xl font-bold text-white">{selectedItem.name}</h2>
                  <p className="text-gray-400 text-sm">{selectedItem.typeName}</p>
                  <div className="flex items-center gap-1 text-amber-400 mt-1">
                    <Coins className="w-4 h-4" />
                    {selectedItem.price} Gold
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-400 mb-1">Statistik</h3>
                <p className="text-white whitespace-pre-line">{selectedItem.description}</p>
              </div>

              {/* Passive Skills */}
              {(selectedItem.passiveSkills?.length ?? 0) > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-400 mb-2">Skill Passive</h3>
                  {selectedItem.passiveSkills.map((skill, idx) => (
                    <div key={idx} className="bg-dark-400 rounded-lg p-3 mb-2">
                      <p className="text-white text-sm whitespace-pre-line">{skill.description}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Builds From */}
              {(selectedItem.buildsFrom?.length ?? 0) > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-400 mb-2">Komponen yang Dibutuhkan</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedItem.buildsFrom?.map((comp) => (
                      <div
                        key={comp.id}
                        className="flex items-center gap-2 bg-dark-400 rounded-lg px-2 py-1 cursor-pointer hover:bg-dark-200"
                        onClick={() => {
                          const fullItem = items?.find(i => i.id === comp.id);
                          if (fullItem) setSelectedItem(fullItem);
                        }}
                      >
                        <img src={comp.icon} alt={comp.name} className="w-6 h-6 rounded" />
                        <span className="text-sm text-white">{comp.name}</span>
                        <span className="text-xs text-amber-400">{comp.price}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upgrades To */}
              {(selectedItem.upgradesTo?.length ?? 0) > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-400 mb-2">Bisa Diupgrade Menjadi</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedItem.upgradesTo?.map((upgrade) => (
                      <div
                        key={upgrade.id}
                        className="flex items-center gap-2 bg-primary-500/20 border border-primary-500/30 rounded-lg px-2 py-1 cursor-pointer hover:bg-primary-500/30"
                        onClick={() => {
                          const fullItem = items?.find(i => i.id === upgrade.id);
                          if (fullItem) setSelectedItem(fullItem);
                        }}
                      >
                        <img src={upgrade.icon} alt={upgrade.name} className="w-6 h-6 rounded" />
                        <span className="text-sm text-white">{upgrade.name}</span>
                        <span className="text-xs text-amber-400">{upgrade.price}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Close Button */}
              <button
                onClick={() => setSelectedItem(null)}
                className="w-full py-3 bg-dark-400 hover:bg-dark-200 text-white rounded-xl transition-colors"
              >
                Tutup
              </button>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
