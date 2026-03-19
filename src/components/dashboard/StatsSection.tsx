import { FileText, List, ThumbsUp, TrendingUp } from 'lucide-react';
import type { Contributor } from '../../hooks/useUser';

interface StatsSectionProps {
  user: Contributor;
}

export function StatsSection({ user }: StatsSectionProps) {
  const stats = [
    {
      label: 'Total Kontribusi',
      value: user.totalContributions || 0,
      icon: FileText,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'Tier List Dibuat',
      value: user.totalTierLists || 0,
      icon: List,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      label: 'Total Vote',
      value: user.totalVotes || 0,
      icon: ThumbsUp,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-500/10',
    },
    {
      label: 'Total Skor',
      value: (user.totalContributions || 0) * 5 + (user.totalTierLists || 0) * 10 + (user.totalVotes || 0),
      icon: TrendingUp,
      color: 'from-orange-500 to-yellow-500',
      bgColor: 'bg-orange-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <div key={index} className="card-hover p-4">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`w-6 h-6 bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`} />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-400 mb-1">{stat.label}</p>
              <p className="text-2xl font-bold">{stat.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
