import { List, ThumbsUp, Calendar, Loader2, ExternalLink } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { useUserTierLists, type TierList } from '../../hooks/useTierLists';

function TierListCard({ tierList }: { tierList: TierList }) {
  const heroCount = Object.values(tierList.tiers || {}).flat().length;
  const tierCount = Object.keys(tierList.tiers || {}).filter(k => (tierList.tiers[k] || []).length > 0).length;

  return (
    <div className="p-4 rounded-lg border border-white/10 bg-dark-50 hover:border-primary-500/50 transition-all">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-white truncate mb-2">{tierList.title}</h4>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <span className="flex items-center gap-1">
              <ThumbsUp className="w-4 h-4" />
              {tierList.votes} vote
            </span>
            <span>{heroCount} hero</span>
            <span>{tierCount} tier</span>
          </div>
          <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {new Date(tierList.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </p>
        </div>
        <Link
          to="/tier-list"
          className="p-2 rounded-lg bg-primary-500/20 text-primary-400 hover:bg-primary-500/30 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

export function TierListsSection() {
  const { data: tierLists, isLoading, error } = useUserTierLists();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400">Gagal memuat tier list</p>
      </div>
    );
  }

  const totalVotes = tierLists?.reduce((sum, t) => sum + t.votes, 0) || 0;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-purple-500/20 rounded-lg">
          <List className="w-6 h-6 text-purple-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Tier List Saya</h2>
          <p className="text-gray-400 text-sm">Tier ranking hero yang kamu buat</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="p-3 bg-dark-50 rounded-lg text-center">
          <p className="text-2xl font-bold">{tierLists?.length || 0}</p>
          <p className="text-xs text-gray-400">Total Tier List</p>
        </div>
        <div className="p-3 bg-green-500/10 rounded-lg text-center">
          <p className="text-2xl font-bold text-green-400">{totalVotes}</p>
          <p className="text-xs text-gray-400">Total Vote</p>
        </div>
      </div>

      {/* Tier Lists */}
      {!tierLists || tierLists.length === 0 ? (
        <div className="text-center py-12 bg-dark-50 rounded-lg">
          <List className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 mb-2">Belum ada tier list</p>
          <p className="text-sm text-gray-500 mb-4">Buat tier ranking hero pertamamu!</p>
          <Link
            to="/tier-list"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
          >
            <List className="w-4 h-4" />
            Buat Tier List
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {tierLists.map((tierList) => (
            <TierListCard key={tierList.id} tierList={tierList} />
          ))}
        </div>
      )}
    </div>
  );
}
