import { useState, useEffect } from 'react';
import { useArcana } from '../hooks/useItems';
import { Loading } from '../components/ui/Loading';
import { motion } from 'framer-motion';
import type { Arcana } from '../types/hero';
import { EMBLEMS } from '../data/mlbbEmblems';
import type { EmblemDef } from '../data/mlbbEmblems';

const ROLE_COLORS: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  'tank':     { bg: 'bg-blue-500/10',   border: 'border-blue-500/30',   text: 'text-blue-400',   badge: 'bg-blue-500/20 text-blue-400' },
  'assassin': { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400', badge: 'bg-purple-500/20 text-purple-400' },
  'mage':     { bg: 'bg-cyan-500/10',   border: 'border-cyan-500/30',   text: 'text-cyan-400',   badge: 'bg-cyan-500/20 text-cyan-400' },
  'fighter':  { bg: 'bg-red-500/10',    border: 'border-red-500/30',    text: 'text-red-400',    badge: 'bg-red-500/20 text-red-400' },
  'support':  { bg: 'bg-green-500/10',  border: 'border-green-500/30',  text: 'text-green-400',  badge: 'bg-green-500/20 text-green-400' },
  'marksman': { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400', badge: 'bg-yellow-500/20 text-yellow-400' },
  'common':   { bg: 'bg-gray-500/10',   border: 'border-gray-500/30',   text: 'text-gray-400',   badge: 'bg-gray-500/20 text-gray-400' },
};

function getRoleClasses(role: string) {
  return ROLE_COLORS[role] || ROLE_COLORS['common'];
}

export function ArcanaPage() {
  useEffect(() => {
    document.title = 'Panduan Emblem - Mobile Legends: Bang Bang | MLBB Hub';
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute('content', 'Jelajahi semua emblem Mobile Legends: Bang Bang. Temukan emblem terbaik untuk setiap hero dan role.');
    return () => { document.title = 'MLBB Hub - Mobile Legends: Bang Bang Community Hub'; };
  }, []);

  const { data: emblems, isLoading, error } = useArcana();
  const [selectedEmblem, setSelectedEmblem] = useState<Arcana | null>(null);
  const [selectedStandard, setSelectedStandard] = useState<string[]>([]);
  const [selectedCore, setSelectedCore] = useState<string | null>(null);

  // Find static emblem data (talents, icons) matching the selected API emblem
  const emblemData: EmblemDef | null = selectedEmblem
    ? (EMBLEMS.find(e => e.id === (selectedEmblem.role || selectedEmblem.colorName?.toLowerCase())) ?? null)
    : null;

  function openModal(emblem: Arcana) {
    setSelectedEmblem(emblem);
    setSelectedStandard([]);
    setSelectedCore(null);
  }

  function closeModal() {
    setSelectedEmblem(null);
    setSelectedStandard([]);
    setSelectedCore(null);
  }

  function toggleStandard(name: string) {
    setSelectedStandard(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  }

  if (isLoading) return <Loading />;
  if (error) return <div className="text-center text-red-500 py-10">Gagal memuat emblem</div>;

  return (
    <div className="min-h-screen bg-dark-400 py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-white mb-2">Emblem</h1>
          <p className="text-gray-400">
            Pilih emblem yang sesuai dengan role hero-mu. Setiap emblem memberikan stat utama dan talent unik.
          </p>
        </div>

        {/* Emblem Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(emblems || []).map((emblem, idx) => {
            const classes = getRoleClasses(emblem.role || emblem.colorName?.toLowerCase());
            return (
              <motion.div
                key={emblem.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.06 }}
                onClick={() => openModal(emblem)}
                className={`
                  cursor-pointer rounded-xl p-5 border transition-all duration-200
                  ${classes.bg} ${classes.border}
                  hover:scale-[1.02] hover:shadow-lg
                `}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-16 h-16 rounded-xl overflow-hidden border ${classes.border} flex-shrink-0 bg-dark-400`}>
                    <img
                      src={emblem.icon}
                      alt={emblem.name}
                      className="w-full h-full object-contain p-1"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  </div>
                  <div>
                    <h3 className={`text-lg font-bold ${classes.text}`}>{emblem.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${classes.badge}`}>
                      {emblem.colorName} Emblem
                    </span>
                  </div>
                </div>

                {/* Attributes */}
                <div className="space-y-1.5">
                  {emblem.description.split(', ').map((attr, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-xs text-gray-400 capitalize">{attr.split(' +')[0]?.trim()}</span>
                      <span className={`text-xs font-semibold ${classes.text}`}>
                        +{attr.split(' +')[1]?.trim() || '—'}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Detail Modal */}
        {selectedEmblem && (
          <div
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-dark-300 rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {(() => {
                const classes = getRoleClasses(selectedEmblem.role || selectedEmblem.colorName?.toLowerCase());
                return (
                  <>
                    {/* Header */}
                    <div className="flex items-start gap-4 mb-5">
                      <div className={`w-20 h-20 rounded-xl overflow-hidden border ${classes.border} ${classes.bg} flex-shrink-0`}>
                        <img
                          src={selectedEmblem.icon}
                          alt={selectedEmblem.name}
                          className="w-full h-full object-contain p-2"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-white">{selectedEmblem.name}</h2>
                        <span className={`text-sm ${classes.text}`}>{selectedEmblem.colorName} Emblem</span>
                      </div>
                    </div>

                    {/* Base Stats */}
                    <div className="mb-5">
                      <h3 className="text-sm font-semibold text-gray-400 mb-3">Base Stats (Max Level)</h3>
                      <div className={`rounded-xl ${classes.bg} border ${classes.border} divide-y divide-white/5`}>
                        {selectedEmblem.description.split(', ').map((attr, i) => {
                          const [label, val] = attr.split(' +');
                          return (
                            <div key={i} className="flex items-center justify-between px-4 py-2.5">
                              <span className="text-sm text-gray-300 capitalize">{label?.trim()}</span>
                              <span className={`text-sm font-bold ${classes.text}`}>+{val?.trim()}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Talents from static data */}
                    {emblemData && (
                      <>
                        {/* Standard Talents */}
                        <div className="mb-5">
                          <h3 className="text-sm font-semibold text-gray-400 mb-3">Standard Talents</h3>
                          <div className="grid grid-cols-1 gap-2">
                            {emblemData.standard.map(talent => {
                              const isSelected = selectedStandard.includes(talent.name);
                              return (
                                <button
                                  key={talent.name}
                                  onClick={() => toggleStandard(talent.name)}
                                  className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                                    isSelected
                                      ? `${classes.bg} ${classes.border} ring-1 ring-current`
                                      : 'bg-dark-400 border-white/10 hover:border-white/20'
                                  }`}
                                >
                                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-dark-300 flex-shrink-0">
                                    <img
                                      src={talent.icon}
                                      alt={talent.name}
                                      className="w-full h-full object-contain p-1"
                                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                    />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className={`text-sm font-semibold ${isSelected ? classes.text : 'text-white'}`}>
                                      {talent.name}
                                    </div>
                                    <div className="text-xs text-gray-400 mt-0.5 leading-relaxed">{talent.effect}</div>
                                  </div>
                                  {isSelected && (
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${classes.badge}`}>
                                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                                      </svg>
                                    </div>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Core Talent */}
                        <div className="mb-5">
                          <h3 className="text-sm font-semibold text-gray-400 mb-3">Core Talent
                            <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-normal">Signature</span>
                          </h3>
                          <div className="grid grid-cols-1 gap-2">
                            {emblemData.core.map(talent => {
                              const isSelected = selectedCore === talent.name;
                              return (
                                <button
                                  key={talent.name}
                                  onClick={() => setSelectedCore(isSelected ? null : talent.name)}
                                  className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                                    isSelected
                                      ? `${classes.bg} ${classes.border} ring-1 ring-current`
                                      : 'bg-dark-400 border-white/10 hover:border-white/20'
                                  }`}
                                >
                                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-dark-300 flex-shrink-0">
                                    <img
                                      src={talent.icon}
                                      alt={talent.name}
                                      className="w-full h-full object-contain p-1"
                                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                    />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className={`text-sm font-semibold ${isSelected ? classes.text : 'text-white'}`}>
                                        {talent.name}
                                      </span>
                                      <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">SIG</span>
                                    </div>
                                    <div className="text-xs text-gray-400 mt-0.5 leading-relaxed">{talent.effect}</div>
                                  </div>
                                  {isSelected && (
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${classes.badge}`}>
                                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                                      </svg>
                                    </div>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </>
                    )}

                    <button
                      onClick={closeModal}
                      className="w-full py-3 bg-dark-400 hover:bg-dark-200 text-white rounded-xl transition-colors"
                    >
                      Tutup
                    </button>
                  </>
                );
              })()}
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
