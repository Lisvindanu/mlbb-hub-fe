import { useState, useMemo, useEffect } from 'react';
import { useHeroes } from '../hooks/useHeroes';
import { useAuth } from '../contexts/AuthContext';
import { Loading } from '../components/ui/Loading';
import { Search, ChevronRight, Shield, Sword, AlertCircle, PenLine, X, Plus, Trash2, ArrowLeft, Users, Zap } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { motion, AnimatePresence } from 'framer-motion';
import type { Hero } from '../types/hero';

const API_BASE_URL = import.meta.env.DEV ? '' : 'https://mlbbapi.project-n.site';

export function CounterPage() {
  useEffect(() => {
    document.title = 'Counter Picks - Mobile Legends: Bang Bang | MLBB Hub';
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute('content', 'Find the best counter picks for every Mobile Legends: Bang Bang hero. Dominate your matchups with hero counter data.');
    return () => { document.title = 'MLBB Hub - Mobile Legends: Bang Bang Community Hub'; };
  }, []);

  const { data: heroes, isLoading } = useHeroes();
  const { isAuthenticated, user, token } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHero, setSelectedHero] = useState<Hero | null>(null);
  const [showSuggestModal, setShowSuggestModal] = useState(false);
  const [suggestAction, setSuggestAction] = useState<'add' | 'remove'>('add');
  const [suggestType, setSuggestType] = useState<'strongAgainst' | 'weakAgainst' | 'bestPartner'>('strongAgainst');
  const [suggestTargetHeroes, setSuggestTargetHeroes] = useState<{name: string, icon: string}[]>([]);
  const [suggestDescription, setSuggestDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [heroSearch, setHeroSearch] = useState('');
  const [filterRole, setFilterRole] = useState<string>('All');
  const [filterLane, setFilterLane] = useState<string>('All');
  const [applyInverse, setApplyInverse] = useState(true);

  const roles = ['All', 'Tank', 'Fighter', 'Assassin', 'Mage', 'Marksman', 'Support'];

  const filteredSuggestHeroes = useMemo(() => {
    if (!heroes) return [];

    let filtered = heroes.filter(h => h.heroId !== selectedHero?.heroId);

    if (heroSearch) {
      filtered = filtered.filter(h =>
        h.name.toLowerCase().includes(heroSearch.toLowerCase())
      );
    }

    if (filterRole !== 'All') {
      filtered = filtered.filter(h =>
        h.role?.toLowerCase() === filterRole.toLowerCase()
      );
    }

    if (filterLane !== 'All') {
      filtered = filtered.filter(h =>
        h.lane?.toLowerCase().includes(filterLane.toLowerCase().replace(' lane', ''))
      );
    }

    return filtered;
  }, [heroes, heroSearch, selectedHero, filterRole, filterLane]);

  const existingRelationHeroes = useMemo(() => {
    if (!selectedHero || suggestAction !== 'remove') return [];

    const relationMap = {
      strongAgainst: selectedHero.suppressingHeroes,
      weakAgainst: selectedHero.suppressedHeroes,
      bestPartner: selectedHero.bestPartners,
    };

    const relations = relationMap[suggestType] || {};
    return Object.values(relations).map((r: any) => ({
      name: r.name,
      thumbnail: r.thumbnail,
    }));
  }, [selectedHero, suggestAction, suggestType]);

  const handleSubmitSuggestion = async () => {
    if (!selectedHero) return;
    if (suggestTargetHeroes.length === 0) return;

    setIsSubmitting(true);
    try {
      const promises = suggestTargetHeroes.map(target =>
        fetch(`${API_BASE_URL}/api/contribute`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            type: 'counter',
            contributorName: user?.name || 'Anonymous',
            contributorEmail: user?.email || '',
            data: {
              heroName: selectedHero.name,
              heroIcon: selectedHero.icon,
              action: suggestAction,
              relationshipType: suggestType,
              targetHeroName: target.name,
              targetHeroIcon: target.icon,
              description: suggestDescription,
              applyInverse: applyInverse,
            },
          }),
        })
      );

      await Promise.all(promises);
      setSubmitSuccess(true);
      setTimeout(() => {
        setShowSuggestModal(false);
        setSubmitSuccess(false);
        setSuggestTargetHeroes([]);
        setSuggestDescription('');
        setHeroSearch('');
      }, 2000);
    } catch (error) {
      console.error('Failed to submit suggestion:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleHeroSelection = (hero: {name: string, icon: string}) => {
    setSuggestTargetHeroes(prev => {
      const exists = prev.some(h => h.name === hero.name);
      if (exists) {
        return prev.filter(h => h.name !== hero.name);
      } else {
        return [...prev, { name: hero.name, icon: hero.icon }];
      }
    });
  };

  const filteredHeroes = useMemo(() => {
    if (!heroes) return [];
    if (!searchQuery) return heroes;

    return heroes.filter(hero =>
      hero.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [heroes, searchQuery]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-400 pt-20 md:pt-28 pb-12">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <Loading message="Memuat data counter..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-400">
      {/* Header */}
      <section className="pt-20 md:pt-28 pb-4 md:pb-6 border-b border-white/5">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-2.5 md:gap-3 mb-3 md:mb-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-4xl font-display font-bold text-white">
                  Counter Picks
                </h1>
                <p className="text-gray-400 text-xs md:text-sm">
                  Temukan counter dan sinergi untuk setiap hero
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Sticky Search Bar */}
      <div className="sticky top-16 md:top-20 z-30 bg-dark-400/90 backdrop-blur-xl border-b border-white/5">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 py-3 md:py-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 md:w-5 h-4 md:h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Cari hero..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 md:pl-12 pr-4 py-2.5 md:py-3 bg-dark-300/50 border border-white/10 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-primary-500/50 transition-colors"
            />
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!selectedHero ? (
          /* Hero Selection Grid */
          <motion.section
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="py-6 md:py-8"
          >
            <div className="container mx-auto px-4 md:px-6 lg:px-8">
              {filteredHeroes.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2 md:gap-3">
                  {filteredHeroes.map((hero, index) => (
                    <motion.button
                      key={hero.heroId}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: index * 0.02 }}
                      onClick={() => setSelectedHero(hero)}
                      className="group relative aspect-square overflow-hidden rounded-xl bg-dark-300/50 border border-white/5 hover:border-white/20 transition-all duration-300 hover:scale-105"
                    >
                      <img
                        src={hero.icon}
                        alt={hero.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-2">
                        <p className="text-xs font-medium text-white truncate text-center">{hero.name}</p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20">
                  <AlertCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg">Tidak ada hero yang ditemukan untuk "{searchQuery}"</p>
                </div>
              )}
            </div>
          </motion.section>
        ) : (
          /* Selected Hero Detail */
          <motion.section
            key="detail"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="py-8"
          >
            <div className="container mx-auto px-6 lg:px-8">
              {/* Back Button & Hero Info */}
              <div className="mb-6">
                <button
                  onClick={() => setSelectedHero(null)}
                  className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="text-sm">Kembali ke semua hero</span>
                </button>

                <div className="flex items-center gap-4 p-5 bg-dark-300/50 border border-white/5 rounded-2xl">
                  <img
                    src={selectedHero.icon}
                    alt={selectedHero.name}
                    className="w-20 h-20 rounded-xl border-2 border-primary-500/50"
                  />
                  <div>
                    <h2 className="text-2xl font-display font-bold text-white">{selectedHero.name}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 bg-white/10 rounded-md text-sm text-gray-300">{selectedHero.role}</span>
                      <span className="text-gray-600">•</span>
                      <span className="text-sm text-gray-400">{selectedHero.lane}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Counter Information Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Strong Against */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-dark-300/50 border border-white/5 rounded-2xl overflow-hidden"
                >
                  <div className="bg-gradient-to-r from-green-500/20 to-transparent p-4 border-b border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                        <Sword className="w-5 h-5 text-green-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">Kuat Melawan</h3>
                        <p className="text-xs text-gray-400">{selectedHero.name} meng-counter hero ini</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4">
                    {Object.keys(selectedHero.suppressingHeroes).length > 0 ? (
                      <div className="space-y-2">
                        {Object.entries(selectedHero.suppressingHeroes).map(([key, relation]) => {
                          const counterHero = heroes?.find(h => h.name.toLowerCase() === relation.name.toLowerCase());
                          return (
                            <Link
                              key={key}
                              to="/heroes/$heroId"
                              params={{ heroId: counterHero?.heroId.toString() || '0' }}
                              className="flex items-center gap-3 p-3 bg-dark-200/50 rounded-xl hover:bg-dark-200 transition-colors group"
                            >
                              <img
                                src={relation.thumbnail}
                                alt={relation.name}
                                className="w-12 h-12 rounded-lg"
                              />
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-white group-hover:text-primary-400 transition-colors">
                                  {relation.name}
                                </h4>
                                <p className="text-xs text-gray-500 truncate">{relation.description}</p>
                              </div>
                              <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-primary-400 transition-colors" />
                            </Link>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <AlertCircle className="w-10 h-10 text-gray-600 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Data counter tidak tersedia</p>
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Weak Against */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-dark-300/50 border border-white/5 rounded-2xl overflow-hidden"
                >
                  <div className="bg-gradient-to-r from-red-500/20 to-transparent p-4 border-b border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center">
                        <Shield className="w-5 h-5 text-red-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">Lemah Melawan</h3>
                        <p className="text-xs text-gray-400">Hero ini meng-counter {selectedHero.name}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4">
                    {Object.keys(selectedHero.suppressedHeroes).length > 0 ? (
                      <div className="space-y-2">
                        {Object.entries(selectedHero.suppressedHeroes).map(([key, relation]) => {
                          const counterHero = heroes?.find(h => h.name.toLowerCase() === relation.name.toLowerCase());
                          return (
                            <Link
                              key={key}
                              to="/heroes/$heroId"
                              params={{ heroId: counterHero?.heroId.toString() || '0' }}
                              className="flex items-center gap-3 p-3 bg-dark-200/50 rounded-xl hover:bg-dark-200 transition-colors group"
                            >
                              <img
                                src={relation.thumbnail}
                                alt={relation.name}
                                className="w-12 h-12 rounded-lg"
                              />
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-white group-hover:text-primary-400 transition-colors">
                                  {relation.name}
                                </h4>
                                <p className="text-xs text-gray-500 truncate">{relation.description}</p>
                              </div>
                              <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-primary-400 transition-colors" />
                            </Link>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <AlertCircle className="w-10 h-10 text-gray-600 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Data counter tidak tersedia</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>

              {/* Best Partners */}
              {Object.keys(selectedHero.bestPartners).length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-dark-300/50 border border-white/5 rounded-2xl overflow-hidden mb-6"
                >
                  <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 p-4 border-b border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                        <Users className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">Partner Terbaik</h3>
                        <p className="text-xs text-gray-400">Hero yang bersinergi baik dengan {selectedHero.name}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {Object.entries(selectedHero.bestPartners).map(([key, relation]) => {
                        const partnerHero = heroes?.find(h => h.name.toLowerCase() === relation.name.toLowerCase());
                        return (
                          <Link
                            key={key}
                            to="/heroes/$heroId"
                            params={{ heroId: partnerHero?.heroId.toString() || '0' }}
                            className="flex items-center gap-3 p-3 bg-dark-200/50 rounded-xl hover:bg-dark-200 transition-colors group"
                          >
                            <img
                              src={relation.thumbnail}
                              alt={relation.name}
                              className="w-12 h-12 rounded-lg"
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-white group-hover:text-primary-400 transition-colors">
                                {relation.name}
                              </h4>
                              <p className="text-xs text-gray-500 truncate">{relation.description}</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-primary-400 transition-colors" />
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Suggest Edit Button */}
              {isAuthenticated && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-center"
                >
                  <button
                    onClick={() => setShowSuggestModal(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-500/10 text-primary-400 border border-primary-500/20 rounded-xl hover:bg-primary-500/20 transition-colors"
                  >
                    <PenLine className="w-4 h-4" />
                    <span className="font-medium">Saran Edit</span>
                  </button>
                  <p className="text-xs text-gray-500 mt-2">
                    Bantu tingkatkan data counter untuk komunitas
                  </p>
                </motion.div>
              )}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Suggest Modal */}
      <AnimatePresence>
        {showSuggestModal && selectedHero && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowSuggestModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-dark-300 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-white/10 flex-shrink-0">
                <div>
                  <h3 className="text-lg font-bold text-white">Saran Edit Counter</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Bantu tingkatkan data untuk {selectedHero.name}</p>
                </div>
                <button
                  onClick={() => { setShowSuggestModal(false); setSuggestTargetHeroes([]); setHeroSearch(''); }}
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {submitSuccess ? (
                <div className="p-10 text-center">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Zap className="w-8 h-8 text-green-400" />
                  </div>
                  <p className="text-lg font-bold text-white">Saran Terkirim!</p>
                  <p className="text-sm text-gray-400 mt-2">Admin akan meninjau saranmu</p>
                </div>
              ) : (
                <div className="p-5 space-y-5 overflow-y-auto flex-1">
                  {/* Hero Info */}
                  <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-primary-500/10 to-transparent rounded-xl border border-primary-500/20">
                    <img src={selectedHero.icon} alt={selectedHero.name} className="w-12 h-12 rounded-lg border-2 border-primary-500/50" />
                    <div>
                      <p className="font-semibold text-white">{selectedHero.name}</p>
                      <p className="text-xs text-gray-400">{selectedHero.role} • {selectedHero.lane}</p>
                    </div>
                  </div>

                  {/* Action & Type Selection */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Aksi</label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setSuggestAction('add'); setSuggestTargetHeroes([]); setFilterRole('All'); setFilterLane('All'); setHeroSearch(''); }}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                            suggestAction === 'add'
                              ? 'bg-green-500 text-white'
                              : 'bg-dark-100 text-gray-400 hover:bg-dark-50'
                          }`}
                        >
                          <Plus className="w-4 h-4" /> Tambah
                        </button>
                        <button
                          onClick={() => { setSuggestAction('remove'); setSuggestTargetHeroes([]); }}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                            suggestAction === 'remove'
                              ? 'bg-red-500 text-white'
                              : 'bg-dark-100 text-gray-400 hover:bg-dark-50'
                          }`}
                        >
                          <Trash2 className="w-4 h-4" /> Hapus
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Kategori</label>
                      <select
                        value={suggestType}
                        onChange={(e) => { setSuggestType(e.target.value as typeof suggestType); setSuggestTargetHeroes([]); }}
                        className="w-full py-2.5 px-3 bg-dark-100 border border-white/10 rounded-xl text-white text-sm font-medium focus:border-primary-500 focus:outline-none"
                      >
                        <option value="strongAgainst">Kuat Melawan</option>
                        <option value="weakAgainst">Lemah Melawan</option>
                        <option value="bestPartner">Partner Terbaik</option>
                      </select>
                    </div>
                  </div>

                  {/* Target Hero Selection */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                      {suggestAction === 'add' ? 'Pilih Hero untuk Ditambahkan' : 'Pilih Hero untuk Dihapus'}
                    </label>

                    {suggestAction === 'remove' ? (
                      existingRelationHeroes.length > 0 ? (
                        <div>
                          {suggestTargetHeroes.length > 0 && (
                            <div className="mb-2 px-3 py-2 bg-red-500/20 rounded-xl text-sm text-red-300 flex items-center justify-between">
                              <span>{suggestTargetHeroes.length} dipilih</span>
                              <button onClick={() => setSuggestTargetHeroes([])} className="text-xs hover:text-white">Hapus</button>
                            </div>
                          )}
                          <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto p-1">
                            {existingRelationHeroes.map((hero) => {
                              const isSelected = suggestTargetHeroes.some(h => h.name === hero.name);
                              return (
                                <button
                                  key={hero.name}
                                  onClick={() => toggleHeroSelection({ name: hero.name, icon: hero.thumbnail })}
                                  className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                                    isSelected
                                      ? 'bg-red-500/30 border-2 border-red-500'
                                      : 'bg-dark-100 border border-white/10 hover:border-red-500/30'
                                  }`}
                                >
                                  <img src={hero.thumbnail} alt={hero.name} className="w-10 h-10 rounded-lg" />
                                  <span className="text-[10px] font-medium truncate w-full text-center">{hero.name}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="p-6 bg-dark-100 rounded-xl text-center">
                          <AlertCircle className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                          <p className="text-sm text-gray-400">Tidak ada hero di kategori ini</p>
                        </div>
                      )
                    ) : (
                      <div>
                        {suggestTargetHeroes.length > 0 && (
                          <div className="mb-2 px-3 py-2 bg-green-500/20 rounded-xl text-sm text-green-300 flex items-center justify-between">
                            <span>{suggestTargetHeroes.length} dipilih</span>
                            <button onClick={() => setSuggestTargetHeroes([])} className="text-xs hover:text-white">Hapus</button>
                          </div>
                        )}

                        <div className="flex gap-2 mb-3">
                          <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input
                              type="text"
                              value={heroSearch}
                              onChange={(e) => setHeroSearch(e.target.value)}
                              placeholder="Cari..."
                              className="w-full py-2 pl-8 pr-3 bg-dark-100 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:border-primary-500 focus:outline-none"
                            />
                          </div>
                          <select
                            value={filterRole}
                            onChange={(e) => setFilterRole(e.target.value)}
                            className="py-2 px-2 bg-dark-100 border border-white/10 rounded-xl text-sm text-white focus:border-primary-500 focus:outline-none"
                          >
                            {roles.map(role => (
                              <option key={role} value={role}>{role}</option>
                            ))}
                          </select>
                        </div>

                        {filteredSuggestHeroes.length > 0 ? (
                          <div className="grid grid-cols-5 gap-2 max-h-44 overflow-y-auto p-1">
                            {filteredSuggestHeroes.slice(0, 25).map((hero) => {
                              const isSelected = suggestTargetHeroes.some(h => h.name === hero.name);
                              return (
                                <button
                                  key={hero.heroId}
                                  onClick={() => toggleHeroSelection({ name: hero.name, icon: hero.icon })}
                                  className={`flex flex-col items-center gap-1 p-1.5 rounded-xl transition-all ${
                                    isSelected
                                      ? 'bg-green-500/30 border-2 border-green-500'
                                      : 'bg-dark-100 border border-white/10 hover:border-green-500/30'
                                  }`}
                                >
                                  <img src={hero.icon} alt={hero.name} className="w-9 h-9 rounded-lg" />
                                  <span className="text-[9px] font-medium truncate w-full text-center">{hero.name}</span>
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="p-6 bg-dark-100 rounded-xl text-center">
                            <AlertCircle className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                            <p className="text-sm text-gray-400">Tidak ada hero yang sesuai filter</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Two-way relationship toggle */}
                  <label className="flex items-start gap-3 p-3 bg-dark-100 rounded-xl border border-white/10 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={applyInverse}
                      onChange={(e) => setApplyInverse(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-gray-600 bg-dark-200 text-primary-500 focus:ring-primary-500 focus:ring-offset-0"
                    />
                    <div>
                      <span className="font-medium text-white text-sm">Terapkan hubungan dua arah</span>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {suggestType === 'weakAgainst'
                          ? `Juga tambahkan ${selectedHero?.name} ke "Kuat Melawan" target`
                          : suggestType === 'strongAgainst'
                          ? `Juga tambahkan ${selectedHero?.name} ke "Lemah Melawan" target`
                          : `Juga tambahkan ${selectedHero?.name} ke "Partner Terbaik" target`}
                      </p>
                    </div>
                  </label>

                  {/* Reason */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Alasan (Opsional)</label>
                    <textarea
                      value={suggestDescription}
                      onChange={(e) => setSuggestDescription(e.target.value)}
                      placeholder="mis., Setelah patch 1.5, hero ini sekarang meng-counter..."
                      rows={2}
                      className="w-full p-3 bg-dark-100 border border-white/10 rounded-xl text-white placeholder-gray-500 resize-none focus:border-primary-500 focus:outline-none text-sm"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    onClick={handleSubmitSuggestion}
                    disabled={suggestTargetHeroes.length === 0 || isSubmitting}
                    className={`w-full py-3.5 rounded-xl font-bold text-white transition-all ${
                      suggestTargetHeroes.length > 0 && !isSubmitting
                        ? suggestAction === 'add'
                          ? 'bg-green-500 hover:bg-green-600'
                          : 'bg-red-500 hover:bg-red-600'
                        : 'bg-gray-600 cursor-not-allowed'
                    }`}
                  >
                    {isSubmitting
                      ? 'Mengirim...'
                      : suggestAction === 'add'
                        ? `Tambah ${suggestTargetHeroes.length} Hero`
                        : `Hapus ${suggestTargetHeroes.length} Hero`}
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
