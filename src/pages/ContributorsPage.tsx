import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchContributors } from '../api/tierLists';
import { Loading } from '../components/ui/Loading';
import { Trophy, Users, ListChecks, ThumbsUp, X, Loader2, Clock, CheckCircle, XCircle } from 'lucide-react';

const RANK_TIERS = [
  { name: 'Mythical Glory', minPts: 5000, image: 'https://static.wikia.nocookie.net/mobile-legends/images/4/42/Mythical_Glory.png/revision/latest?cb=20240224062034', glow: '#FFB300', textColor: '#FFD54F' },
  { name: 'Mythical Honor', minPts: 2000, image: 'https://static.wikia.nocookie.net/mobile-legends/images/c/c8/Mythical_Honor.png/revision/latest?cb=20240224062004', glow: '#E040FB', textColor: '#EA80FC' },
  { name: 'Mythic',         minPts: 750,  image: 'https://static.wikia.nocookie.net/mobile-legends/images/e/ec/Mythic.png/revision/latest?cb=20240224061935',          glow: '#FF1744', textColor: '#FF6E7A' },
  { name: 'Legend',         minPts: 200,  image: 'https://static.wikia.nocookie.net/mobile-legends/images/1/10/Legend.png/revision/latest?cb=20240224061855',          glow: '#FFD700', textColor: '#FFE57F' },
  { name: 'Epic',           minPts: 0,    image: 'https://static.wikia.nocookie.net/mobile-legends/images/2/26/Epic.png/revision/latest?cb=20240224061803',            glow: '#3D5AFE', textColor: '#82B1FF' },
] as const;

type RankTier = typeof RANK_TIERS[number];

function getRankTier(points: number): RankTier {
  for (const tier of RANK_TIERS) {
    if (points >= tier.minPts) return tier;
  }
  return RANK_TIERS[RANK_TIERS.length - 1];
}

function RankBadge({ points }: { points: number }) {
  const tier = getRankTier(points);
  return (
    <div className="flex flex-col items-center" title={`${tier.name} (${points} pts)`}>
      <img
        src={tier.image}
        alt={tier.name}
        className="w-11 h-11 object-contain"
        style={{ filter: `drop-shadow(0 0 6px ${tier.glow}99)` }}
      />
      <p className="text-[9px] font-bold mt-0.5 leading-none" style={{ color: tier.textColor }}>
        {tier.name === 'Mythical Glory' ? 'M.Glory' : tier.name === 'Mythical Honor' ? 'M.Honor' : tier.name}
      </p>
    </div>
  );
}

const API_BASE_URL = import.meta.env.DEV ? '' : 'https://mlbbapi.project-n.site';

interface ContributorDetail {
  contributor: {
    id: string;
    name: string;
    totalContributions: number;
    totalTierLists: number;
    totalVotes: number;
    createdAt: string;
  };
  contributions: Array<{
    id: string;
    type: string;
    data: Record<string, unknown>;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: string;
  }>;
  tierLists: Array<{
    id: string;
    title: string;
    votes: number;
    createdAt: string;
  }>;
}

export function ContributorsPage() {
  const [selectedContributor, setSelectedContributor] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const { data: contributors, isLoading } = useQuery({
    queryKey: ['contributors'],
    queryFn: fetchContributors,
  });

  const { data: contributorDetail, isLoading: isLoadingDetail } = useQuery({
    queryKey: ['contributorDetail', selectedContributor],
    queryFn: async (): Promise<ContributorDetail> => {
      const res = await fetch(`${API_BASE_URL}/api/contributors/${selectedContributor}/contributions`);
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
    enabled: !!selectedContributor && showModal,
  });

  const handleContributorClick = (contributorId: string) => {
    setSelectedContributor(contributorId);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedContributor(null);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 md:px-6 lg:px-8 pt-20 md:pt-28 pb-12">
        <Loading message="Memuat kontributor..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-400">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 pt-20 md:pt-28 pb-12">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-3xl md:text-5xl font-display font-bold mb-2 md:mb-4">
          Kontributor Teratas
        </h1>
        <p className="text-gray-400 text-sm md:text-lg">
          Anggota komunitas yang membantu menjaga MLBB Hub tetap up-to-date
        </p>
      </div>

      {/* Coming Soon Message */}
      {(!contributors || contributors.length === 0) && (
        <div className="bg-dark-200 border border-white/10 rounded-xl p-12 text-center">
          <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">
            Leaderboard Segera Hadir!
          </h2>
          <p className="text-gray-400 mb-6">
            Mulai berkontribusi skin, tier list, dan data untuk naik peringkat
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
            <div className="bg-dark-100 p-4 rounded-lg">
              <ListChecks className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <h3 className="font-semibold text-white mb-1">Kontribusi Skin</h3>
              <p className="text-sm text-gray-400">Tambahkan skin & series yang belum ada</p>
            </div>
            <div className="bg-dark-100 p-4 rounded-lg">
              <Trophy className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
              <h3 className="font-semibold text-white mb-1">Tier List</h3>
              <p className="text-sm text-gray-400">Bagikan peringkat meta kamu</p>
            </div>
            <div className="bg-dark-100 p-4 rounded-lg">
              <ThumbsUp className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <h3 className="font-semibold text-white mb-1">Vote Komunitas</h3>
              <p className="text-sm text-gray-400">Dapatkan vote dari pengguna lain</p>
            </div>
          </div>
        </div>
      )}

      {/* Contributors Leaderboard */}
      {contributors && contributors.length > 0 && (
        <div className="space-y-4">
          {contributors.map((contributor, index) => {
            const rank = index + 1;
            const points = (contributor.totalContributions || 0) * 5 + contributor.totalTierLists * 10 + contributor.totalVotes;

            return (
              <button
                key={contributor.id}
                onClick={() => handleContributorClick(contributor.id)}
                className="w-full text-left bg-dark-200 border border-white/10 rounded-xl p-6 hover:border-primary-500/30 hover:bg-dark-100 transition-colors cursor-pointer"
              >
                <div className="flex items-start gap-3 md:gap-4">
                  {/* Rank Badge */}
                  <div className="flex-shrink-0 w-12 flex flex-col items-center gap-0.5">
                    <RankBadge points={points} />
                    <p className="text-xs font-bold text-gray-500">#{rank}</p>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-base md:text-xl font-bold text-white truncate">{contributor.name}</h3>
                      {/* Score - Mobile */}
                      <div className="flex-shrink-0 text-right md:hidden">
                        <p className="text-xl font-bold text-primary-400">{points}</p>
                        <p className="text-[10px] text-gray-500">pts</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs md:text-sm">
                      <div className="flex items-center gap-1">
                        <ListChecks className="w-3.5 md:w-4 h-3.5 md:h-4 text-blue-400" />
                        <span className="text-gray-400">{contributor.totalContributions || 0}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Trophy className="w-3.5 md:w-4 h-3.5 md:h-4 text-yellow-400" />
                        <span className="text-gray-400">{contributor.totalTierLists}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ThumbsUp className="w-3.5 md:w-4 h-3.5 md:h-4 text-green-400" />
                        <span className="text-gray-400">{contributor.totalVotes}</span>
                      </div>
                    </div>
                  </div>

                  {/* Score - Desktop */}
                  <div className="hidden md:block flex-shrink-0 text-right">
                    <p className="text-3xl font-bold text-primary-400">{points}</p>
                    <p className="text-xs text-gray-500">Total Poin</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Contributor Detail Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-dark-300 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <div>
                <h3 className="text-xl font-bold">
                  {contributorDetail?.contributor.name || 'Contributor'}
                </h3>
                <p className="text-sm text-gray-400">
                  Bergabung sejak {contributorDetail ? new Date(contributorDetail.contributor.createdAt).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }) : '...'}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 overflow-y-auto max-h-[calc(80vh-80px)]">
              {isLoadingDetail ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary-400" />
                </div>
              ) : contributorDetail ? (
                <div className="space-y-6">
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-4 bg-blue-500/10 rounded-xl text-center">
                      <ListChecks className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-blue-400">{contributorDetail.contributor.totalContributions}</p>
                      <p className="text-xs text-gray-400">Kontribusi</p>
                    </div>
                    <div className="p-4 bg-yellow-500/10 rounded-xl text-center">
                      <Trophy className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-yellow-400">{contributorDetail.contributor.totalTierLists}</p>
                      <p className="text-xs text-gray-400">Tier List</p>
                    </div>
                    <div className="p-4 bg-green-500/10 rounded-xl text-center">
                      <ThumbsUp className="w-6 h-6 text-green-400 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-green-400">{contributorDetail.contributor.totalVotes}</p>
                      <p className="text-xs text-gray-400">Vote</p>
                    </div>
                  </div>

                  {/* Contributions */}
                  {contributorDetail.contributions.length > 0 && (
                    <div>
                      <h4 className="text-lg font-bold mb-3 flex items-center gap-2">
                        <ListChecks className="w-5 h-5 text-blue-400" />
                        Kontribusi
                      </h4>
                      <div className="space-y-2">
                        {contributorDetail.contributions.map((c) => {
                          const StatusIcon = c.status === 'approved' ? CheckCircle : c.status === 'rejected' ? XCircle : Clock;
                          const statusColor = c.status === 'approved' ? 'text-green-400' : c.status === 'rejected' ? 'text-red-400' : 'text-yellow-400';

                          const getTitle = () => {
                            const data = c.data;
                            if (c.type === 'counter') {
                              const action = data.action as string;
                              const heroName = data.heroName as string;
                              const targetHeroName = data.targetHeroName as string;
                              return `${action === 'add' ? 'Tambah' : 'Hapus'} ${targetHeroName} → ${heroName}`;
                            }
                            if (c.type === 'skin') {
                              return `Skin: ${data.heroName || 'Tidak diketahui'}`;
                            }
                            return c.type;
                          };

                          return (
                            <div key={c.id} className="flex items-center justify-between p-3 bg-dark-100 rounded-lg">
                              <div className="flex items-center gap-3">
                                <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${
                                  c.type === 'counter' ? 'bg-amber-500/20 text-amber-400' :
                                  c.type === 'skin' ? 'bg-purple-500/20 text-purple-400' :
                                  c.type === 'hero' ? 'bg-blue-500/20 text-blue-400' :
                                  'bg-orange-500/20 text-orange-400'
                                }`}>
                                  {c.type}
                                </span>
                                <span className="text-sm text-white">{getTitle()}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <StatusIcon className={`w-4 h-4 ${statusColor}`} />
                                <span className={`text-xs ${statusColor}`}>{c.status === 'approved' ? 'Disetujui' : c.status === 'rejected' ? 'Ditolak' : 'Menunggu'}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Tier Lists */}
                  {contributorDetail.tierLists.length > 0 && (
                    <div>
                      <h4 className="text-lg font-bold mb-3 flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-yellow-400" />
                        Tier List
                      </h4>
                      <div className="space-y-2">
                        {contributorDetail.tierLists.map((tl) => (
                          <div key={tl.id} className="flex items-center justify-between p-3 bg-dark-100 rounded-lg">
                            <span className="text-sm text-white">{tl.title}</span>
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                              <ThumbsUp className="w-4 h-4 text-green-400" />
                              <span>{tl.votes} vote</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No activity message */}
                  {contributorDetail.contributions.length === 0 && contributorDetail.tierLists.length === 0 && (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-400">Belum ada kontribusi</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-red-400">Gagal memuat detail kontributor</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
