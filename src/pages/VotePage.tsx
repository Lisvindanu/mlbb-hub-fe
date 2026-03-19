import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Loader2, Users, Sparkles } from 'lucide-react';

const API_BASE = import.meta.env.DEV ? '' : 'https://mlbbapi.project-n.site';

const RECENTLY_IMPLEMENTED = [
  { label: 'Dropdown "More" — text nowrap fix', date: 'Mar 2026', tag: 'UI Fix' },
  { label: 'Draft Pick — Switch Side per game', date: 'Mar 2026', tag: 'Feature' },
  { label: 'Hero Build Playground — save, share & stats breakdown', date: 'Mar 2026', tag: 'Simulator' },
  { label: 'Item Synergy Checker — passive conflict detection', date: 'Mar 2026', tag: 'Guide' },
  { label: 'Dev Talk & Community Board — posts, replies, dev updates', date: 'Mar 2026', tag: 'Community' },
];

const FEATURES: never[] = [];

function getOrCreateVoterId(): string {
  const stored = localStorage.getItem('hok-voter-id');
  if (stored) return stored;
  const id = crypto.randomUUID();
  localStorage.setItem('hok-voter-id', id);
  return id;
}

interface VoteData {
  counts: Record<string, number>;
  total: number;
  myVote: string | null;
}

export function VotePage() {
  const [data, setData] = useState<VoteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [voterId] = useState(() => getOrCreateVoterId());

  const fetchVotes = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/votes?voterId=${voterId}`);
      const json = await res.json();
      setData(json);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [voterId]);

  useEffect(() => {
    fetchVotes();
  }, [fetchVotes]);

  return (
    <div className="min-h-screen bg-dark-400">
      {/* Header */}
      <section className="relative pt-20 pb-12 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary-500/[0.08] rounded-full blur-[100px]" />
          <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-violet-500/[0.07] rounded-full blur-[100px]" />
        </div>
        <div className="container mx-auto px-4 md:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full mb-6">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-sm text-white/80 font-medium">Voting Dibuka</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
              Fitur apa yang kamu mau<br className="hidden md:block" /> kami buat selanjutnya?
            </h1>
            <p className="text-gray-400 max-w-xl mx-auto text-base">
              Vote fitur favoritmu. Suara terbanyak yang akan kami prioritaskan di update berikutnya.
            </p>
            {data && (
              <div className="mt-5 inline-flex items-center gap-2 text-sm text-gray-500">
                <Users className="w-4 h-4" />
                <span>{data.total} vote sejauh ini</span>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Recently Implemented */}
      {RECENTLY_IMPLEMENTED.length > 0 && (
        <section className="pb-8">
          <div className="container mx-auto px-4 md:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
              <motion.div
                className="flex items-center gap-3 mb-4"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                <span className="text-sm font-semibold text-white">Saran yang sudah diimplementasi</span>
                <div className="flex-1 h-px bg-white/[0.06]" />
                <span className="text-xs text-gray-600">{RECENTLY_IMPLEMENTED.length} item</span>
              </motion.div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {RECENTLY_IMPLEMENTED.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.08 }}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-green-500/[0.05] border border-green-500/[0.12] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]"
                  >
                    <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-green-500/15 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{item.label}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs px-2 py-0.5 bg-white/[0.06] border border-white/[0.08] rounded-full text-gray-400">
                          {item.tag}
                        </span>
                        <span className="text-xs text-gray-600">{item.date}</span>
                      </div>
                    </div>
                    <span className="flex-shrink-0 text-xs px-2.5 py-1 bg-green-500/15 border border-green-500/25 rounded-full text-green-400 font-medium">
                      Sudah ada
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Cards / Empty state */}
      <section className="pb-24">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary-400" />
            </div>
          ) : FEATURES.length === 0 ? (
            <motion.div
              className="max-w-lg mx-auto text-center py-16"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center mx-auto mb-5 shadow-lg">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Semua fitur sudah diimplementasi!</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Semua usulan yang ada sudah berhasil kami wujudkan. Fitur baru untuk divoting akan segera hadir — pantau terus!
              </p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">
              {FEATURES.map((f: never) => f)}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
