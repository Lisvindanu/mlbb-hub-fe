import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { Trophy, Users, Clock, PlayCircle, CheckCircle, Plus, GitBranch } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const API_BASE = import.meta.env.DEV ? '' : 'https://mlbbapi.project-n.site';

interface TournamentItem {
  id: number; name: string; description: string;
  team_count: number; bracket_type: string;
  status: 'registration' | 'ongoing' | 'completed';
  created_by_name: string; created_at: string; joined_teams: number;
  my_team_name?: string;
}

const STATUS_CONFIG = {
  registration: { label: 'Pendaftaran', color: 'text-blue-400', icon: Clock },
  ongoing:      { label: 'Berlangsung', color: 'text-green-400', icon: PlayCircle },
  completed:    { label: 'Selesai',     color: 'text-gray-400',  icon: CheckCircle },
};

function TournamentRow({ t, badge }: { t: TournamentItem; badge?: string }) {
  const s = STATUS_CONFIG[t.status] ?? STATUS_CONFIG.completed;
  const Icon = s.icon;
  return (
    <Link
      to="/tournament/$id"
      params={{ id: String(t.id) }}
      className="flex items-center gap-3 p-3 rounded-xl border border-white/8 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/15 transition-all group"
    >
      <div className="w-9 h-9 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center shrink-0">
        <Trophy className="w-4 h-4 text-yellow-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-medium text-sm text-white group-hover:text-primary-300 transition-colors truncate">{t.name}</span>
          {t.bracket_type === 'double' && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full border text-purple-400 bg-purple-500/15 border-purple-500/30 flex items-center gap-0.5">
              <GitBranch className="w-2 h-2" /> DE
            </span>
          )}
          {badge && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary-500/20 text-primary-400 border border-primary-500/30">{badge}</span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
          <span className={`flex items-center gap-1 ${s.color}`}>
            <Icon className="w-2.5 h-2.5" /> {s.label}
          </span>
          <span className="flex items-center gap-0.5"><Users className="w-2.5 h-2.5" /> {t.joined_teams}/{t.team_count}</span>
          {t.my_team_name && <span className="text-gray-600">Tim: {t.my_team_name}</span>}
        </div>
      </div>
      <div className="text-xs text-gray-600 shrink-0">
        {new Date(t.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
      </div>
    </Link>
  );
}

export function TournamentsSection() {
  const { token } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['userTournaments', token],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/user/tournaments`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed');
      return res.json() as Promise<{ created: TournamentItem[]; joined: TournamentItem[] }>;
    },
    enabled: !!token,
    staleTime: 0,
  });

  if (isLoading) return (
    <div className="space-y-2">
      {[1, 2].map(i => <div key={i} className="h-16 rounded-xl bg-white/[0.03] animate-pulse" />)}
    </div>
  );

  const created = data?.created ?? [];
  const joined = data?.joined ?? [];
  const isEmpty = created.length === 0 && joined.length === 0;

  if (isEmpty) return (
    <div className="text-center py-12">
      <Trophy className="w-10 h-10 mx-auto mb-3 text-gray-700" />
      <p className="text-gray-500 text-sm mb-4">Kamu belum mengikuti atau membuat turnamen</p>
      <Link to="/tournament/" className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500/20 hover:bg-primary-500/30 text-primary-400 rounded-xl text-sm font-medium transition-colors border border-primary-500/30">
        <Plus className="w-4 h-4" /> Lihat Turnamen
      </Link>
    </div>
  );

  return (
    <div className="space-y-6">
      {created.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Trophy className="w-3.5 h-3.5" /> Turnamen yang Saya Buat ({created.length})
          </h3>
          <div className="space-y-2">
            {created.map(t => <TournamentRow key={t.id} t={t} badge="Creator" />)}
          </div>
        </div>
      )}
      {joined.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Users className="w-3.5 h-3.5" /> Turnamen yang Saya Ikuti ({joined.length})
          </h3>
          <div className="space-y-2">
            {joined.map(t => <TournamentRow key={t.id} t={t} />)}
          </div>
        </div>
      )}
    </div>
  );
}
