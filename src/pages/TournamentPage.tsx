import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { Trophy, Plus, Users, Clock, CheckCircle, PlayCircle, X, LogIn, GitBranch } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const API_BASE = import.meta.env.DEV ? '' : 'https://mlbbapi.project-n.site';

interface Tournament {
  id: number; name: string; description: string;
  team_count: number; bracket_type: string;
  status: 'registration' | 'ongoing' | 'completed';
  created_by_name: string; created_at: string; joined_teams: number;
}

async function fetchTournaments(): Promise<Tournament[]> {
  const res = await fetch(`${API_BASE}/api/tournaments`);
  return res.json();
}

async function createTournament(data: {
  name: string; description: string; team_count: number; bracket_type: string;
}, token: string) {
  const res = await fetch(`${API_BASE}/api/tournaments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}

const STATUS_LABEL = {
  registration: { label: 'Pendaftaran', color: 'text-blue-400 bg-blue-500/15 border-blue-500/30', icon: <Clock className="w-3 h-3" /> },
  ongoing:      { label: 'Berlangsung', color: 'text-green-400 bg-green-500/15 border-green-500/30', icon: <PlayCircle className="w-3 h-3" /> },
  completed:    { label: 'Selesai',     color: 'text-gray-400 bg-gray-500/15 border-gray-500/30',  icon: <CheckCircle className="w-3 h-3" /> },
};

export function TournamentPage() {
  useEffect(() => {
    document.title = 'Turnamen - MLBB Hub';
    return () => { document.title = 'MLBB Hub - Mobile Legends: Bang Bang Community Hub'; };
  }, []);

  const { token, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const { data: tournaments = [], isLoading } = useQuery({ queryKey: ['tournaments'], queryFn: fetchTournaments });

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', team_count: 8, bracket_type: 'single' });
  const [createdId, setCreatedId] = useState<number | null>(null);

  const mutation = useMutation({
    mutationFn: (data: typeof form) => createTournament(data, token!),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
      setCreatedId(data.id);
      setShowCreate(false);
      setForm({ name: '', description: '', team_count: 8, bracket_type: 'single' });
    },
  });

  return (
    <div className="min-h-screen bg-dark-400 py-8">
      <div className="max-w-4xl mx-auto px-4">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-white flex items-center gap-3">
              <Trophy className="w-8 h-8 text-yellow-400" />
              Turnamen Komunitas
            </h1>
            <p className="text-gray-400 mt-1">Buat & kelola bracket turnamen MLBB untuk tim kamu</p>
          </div>
          {isAuthenticated ? (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-colors"
            >
              <Plus className="w-4 h-4" /> Buat Turnamen
            </button>
          ) : (
            <Link to="/auth" className="flex items-center gap-2 px-4 py-2.5 bg-dark-300 hover:bg-dark-200 text-gray-300 rounded-xl font-medium border border-white/10 transition-colors text-sm">
              <LogIn className="w-4 h-4" /> Login untuk membuat
            </Link>
          )}
        </div>

        {/* Success notification after create */}
        {createdId && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-2xl bg-green-500/10 border border-green-500/30 flex items-center justify-between"
          >
            <p className="text-green-300 font-medium text-sm">Turnamen berhasil dibuat!</p>
            <div className="flex items-center gap-3">
              <Link
                to="/tournament/$id" params={{ id: String(createdId) }}
                className="text-sm text-primary-400 hover:text-primary-300 underline"
              >
                Buka bracket →
              </Link>
              <button onClick={() => setCreatedId(null)}><X className="w-4 h-4 text-gray-500 hover:text-white" /></button>
            </div>
          </motion.div>
        )}

        {/* List */}
        {isLoading ? (
          <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-24 rounded-2xl bg-white/[0.03] animate-pulse" />)}</div>
        ) : tournaments.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <Trophy className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>Belum ada turnamen. Jadilah yang pertama buat!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tournaments.map((t, i) => {
              const s = STATUS_LABEL[t.status];
              return (
                <motion.div key={t.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <Link
                    to="/tournament/$id" params={{ id: String(t.id) }}
                    className="flex items-center gap-4 p-4 rounded-2xl border border-white/8 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/15 transition-all group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center flex-shrink-0">
                      <Trophy className="w-6 h-6 text-yellow-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-white group-hover:text-primary-300 transition-colors truncate">{t.name}</h3>
                        <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${s.color}`}>
                          {s.icon} {s.label}
                        </span>
                        {t.bracket_type === 'double' && (
                          <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border text-purple-400 bg-purple-500/15 border-purple-500/30">
                            <GitBranch className="w-2.5 h-2.5" /> DE
                          </span>
                        )}
                      </div>
                      {t.description && <p className="text-xs text-gray-500 mt-0.5 truncate">{t.description}</p>}
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {t.joined_teams}/{t.team_count} tim</span>
                        <span>oleh {t.created_by_name}</span>
                      </div>
                    </div>
                    <div className="text-gray-600 text-xs text-right shrink-0">
                      {new Date(t.created_at).toLocaleDateString('id-ID')}
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-dark-300 rounded-2xl p-6 w-full max-w-md"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-white mb-5">Buat Turnamen Baru</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Nama Turnamen *</label>
                <input
                  className="w-full bg-dark-400 border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-primary-500/50"
                  placeholder="Contoh: MLBB Cup Season 1"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Deskripsi</label>
                <textarea
                  className="w-full bg-dark-400 border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-primary-500/50 resize-none"
                  placeholder="Info turnamen, hadiah, dll"
                  rows={2}
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Format</label>
                <div className="flex gap-2">
                  {[
                    { value: 'single', label: 'Single Elim', desc: 'Kalah sekali, gugur' },
                    { value: 'double', label: 'Double Elim', desc: 'Kalah dua kali, gugur' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setForm(f => ({ ...f, bracket_type: opt.value }))}
                      className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-medium border text-left transition-all ${
                        form.bracket_type === opt.value
                          ? 'bg-primary-500/20 border-primary-500 text-primary-300'
                          : 'bg-dark-400 border-white/10 text-gray-400 hover:border-white/20'
                      }`}
                    >
                      <div className="font-semibold">{opt.label}</div>
                      <div className="text-[10px] opacity-70 mt-0.5">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Jumlah Tim</label>
                <div className="flex gap-2">
                  {[4, 8, 16, 32].map(n => (
                    <button
                      key={n}
                      onClick={() => setForm(f => ({ ...f, team_count: n }))}
                      className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${
                        form.team_count === n
                          ? 'bg-primary-500 border-primary-500 text-white'
                          : 'bg-dark-400 border-white/10 text-gray-400 hover:border-white/20'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {mutation.error && <p className="text-red-400 text-xs mt-3">{(mutation.error as Error).message}</p>}

            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowCreate(false)}
                className="flex-1 py-2.5 bg-dark-400 text-gray-400 rounded-xl text-sm hover:text-white transition-colors">
                Batal
              </button>
              <button
                onClick={() => mutation.mutate(form)}
                disabled={!form.name.trim() || mutation.isPending}
                className="flex-1 py-2.5 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors"
              >
                {mutation.isPending ? 'Membuat...' : 'Buat Turnamen'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
