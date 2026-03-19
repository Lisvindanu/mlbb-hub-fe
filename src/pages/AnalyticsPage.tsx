import { useMemo, useEffect } from 'react';
import { useHeroes } from '../hooks/useHeroes';
import { Loading } from '../components/ui/Loading';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { TrendingUp, Users, Target, Ban, Award, BarChart3 } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { motion } from 'framer-motion';

const ROLE_COLORS: Record<string, string> = {
  'Tank': '#3b82f6',
  'Fighter': '#ef4444',
  'Assassin': '#a855f7',
  'Mage': '#06b6d4',
  'Marksman': '#f59e0b',
  'Support': '#10b981',
};

const TIER_COLORS: Record<string, string> = {
  'S+': '#ff6b6b',
  'S': '#ffa726',
  'A': '#ffee58',
  'B': '#66bb6a',
  'C': '#42a5f5',
  'D': '#ab47bc',
};

export function AnalyticsPage() {
  useEffect(() => {
    document.title = 'Hero Analytics - Win Rate & Pick Rate | MLBB Hub';
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute('content', 'Mobile Legends: Bang Bang hero analytics. Compare win rates, pick rates, and ban rates across all heroes.');
    return () => { document.title = 'MLBB Hub - Mobile Legends: Bang Bang Community Hub'; };
  }, []);

  const { data: heroes, isLoading } = useHeroes();

  // Top 10 Win Rate Heroes
  const topWinRateHeroes = useMemo(() => {
    if (!heroes) return [];
    return [...heroes]
      .sort((a, b) => parseFloat(b.stats.winRate) - parseFloat(a.stats.winRate))
      .slice(0, 10)
      .map(h => ({
        name: h.name,
        winRate: parseFloat(h.stats.winRate),
        icon: h.icon,
        heroId: h.heroId,
      }));
  }, [heroes]);

  // Top 10 Pick Rate Heroes
  const topPickRateHeroes = useMemo(() => {
    if (!heroes) return [];
    return [...heroes]
      .sort((a, b) => parseFloat(b.stats.pickRate) - parseFloat(a.stats.pickRate))
      .slice(0, 10)
      .map(h => ({
        name: h.name,
        pickRate: parseFloat(h.stats.pickRate),
        icon: h.icon,
        heroId: h.heroId,
      }));
  }, [heroes]);

  // Top 10 Ban Rate Heroes
  const topBanRateHeroes = useMemo(() => {
    if (!heroes) return [];
    return [...heroes]
      .sort((a, b) => parseFloat(b.stats.banRate) - parseFloat(a.stats.banRate))
      .slice(0, 10)
      .map(h => ({
        name: h.name,
        banRate: parseFloat(h.stats.banRate),
        icon: h.icon,
        heroId: h.heroId,
      }));
  }, [heroes]);

  // Role distribution
  const roleDistribution = useMemo(() => {
    if (!heroes) return [];
    const roleCount = heroes.reduce((acc, hero) => {
      acc[hero.role] = (acc[hero.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(roleCount).map(([role, count]) => ({
      name: role,
      value: count,
      color: ROLE_COLORS[role] || '#6b7280',
    }));
  }, [heroes]);

  // Tier distribution
  const tierDistribution = useMemo(() => {
    if (!heroes) return [];
    const tierCount = heroes.reduce((acc, hero) => {
      const tier = hero.stats.tier || 'C';
      acc[tier] = (acc[tier] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const tierOrder = ['S+', 'S', 'A', 'B', 'C', 'D'];
    return tierOrder
      .filter(tier => tierCount[tier])
      .map(tier => ({
        tier,
        count: tierCount[tier],
        fill: TIER_COLORS[tier] || '#8b5cf6',
      }));
  }, [heroes]);

  // Average stats by role
  const avgStatsByRole = useMemo(() => {
    if (!heroes) return [];
    const roleStats: Record<string, { total: number; winRate: number; pickRate: number; banRate: number }> = {};

    heroes.forEach(hero => {
      if (!roleStats[hero.role]) {
        roleStats[hero.role] = { total: 0, winRate: 0, pickRate: 0, banRate: 0 };
      }
      roleStats[hero.role].total++;
      roleStats[hero.role].winRate += parseFloat(hero.stats.winRate) || 0;
      roleStats[hero.role].pickRate += parseFloat(hero.stats.pickRate) || 0;
      roleStats[hero.role].banRate += parseFloat(hero.stats.banRate) || 0;
    });

    return Object.entries(roleStats).map(([role, stats]) => ({
      role,
      winRate: (stats.winRate / stats.total).toFixed(1),
      pickRate: (stats.pickRate / stats.total).toFixed(1),
      banRate: (stats.banRate / stats.total).toFixed(1),
    }));
  }, [heroes]);

  // Overall stats
  const overallStats = useMemo(() => {
    if (!heroes) return { avgWinRate: 0, avgPickRate: 0, avgBanRate: 0, totalHeroes: 0 };

    const total = heroes.length;
    const sumWinRate = heroes.reduce((sum, h) => sum + (parseFloat(h.stats.winRate) || 0), 0);
    const sumPickRate = heroes.reduce((sum, h) => sum + (parseFloat(h.stats.pickRate) || 0), 0);
    const sumBanRate = heroes.reduce((sum, h) => sum + (parseFloat(h.stats.banRate) || 0), 0);

    return {
      avgWinRate: (sumWinRate / total).toFixed(1),
      avgPickRate: (sumPickRate / total).toFixed(1),
      avgBanRate: (sumBanRate / total).toFixed(1),
      totalHeroes: total,
    };
  }, [heroes]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-400 pt-20 md:pt-28 pb-12">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <Loading message="Memuat analytics..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-400">
      {/* Header */}
      <section className="pt-20 md:pt-28 pb-6 md:pb-8 border-b border-white/5">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-2.5 md:gap-3 mb-3 md:mb-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-4xl font-display font-bold text-white">
                  Analytics
                </h1>
                <p className="text-gray-400 text-xs md:text-sm">
                  Statistik komprehensif dari semua hero
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Overview Stats */}
      <section className="py-6 md:py-8">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {[
              { label: 'Total Hero', value: overallStats.totalHeroes, icon: Users, color: 'blue' },
              { label: 'Rata-rata Win Rate', value: `${overallStats.avgWinRate}%`, icon: Award, color: 'green' },
              { label: 'Rata-rata Pick Rate', value: `${overallStats.avgPickRate}%`, icon: Target, color: 'yellow' },
              { label: 'Rata-rata Ban Rate', value: `${overallStats.avgBanRate}%`, icon: Ban, color: 'red' },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="bg-dark-300/50 border border-white/5 rounded-2xl p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{stat.label}</span>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    stat.color === 'blue' ? 'bg-blue-500/20' :
                    stat.color === 'green' ? 'bg-green-500/20' :
                    stat.color === 'yellow' ? 'bg-yellow-500/20' : 'bg-red-500/20'
                  }`}>
                    <stat.icon className={`w-4 h-4 ${
                      stat.color === 'blue' ? 'text-blue-400' :
                      stat.color === 'green' ? 'text-green-400' :
                      stat.color === 'yellow' ? 'text-yellow-400' : 'text-red-400'
                    }`} />
                  </div>
                </div>
                <p className="text-2xl md:text-3xl font-display font-bold text-white">{stat.value}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Charts Grid */}
      <section className="py-6">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Role Distribution */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-dark-300/50 border border-white/5 rounded-2xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4">Distribusi Hero berdasarkan Role</h3>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={roleDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={90}
                    fill="#8884d8"
                    dataKey="value"
                    stroke="rgba(0,0,0,0.3)"
                    strokeWidth={2}
                  >
                    {roleDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(26, 26, 46, 0.95)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      padding: '10px 14px',
                    }}
                    labelStyle={{ color: '#fff', fontWeight: 600 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Tier Distribution */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-dark-300/50 border border-white/5 rounded-2xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4">Distribusi Hero berdasarkan Tier</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={tierDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="tier" stroke="#888" fontSize={12} />
                  <YAxis stroke="#888" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(26, 26, 46, 0.95)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      padding: '10px 14px',
                    }}
                    labelStyle={{ color: '#fff', fontWeight: 600 }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {tierDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Average Stats by Role */}
      <section className="py-6">
        <div className="container mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-dark-300/50 border border-white/5 rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Rata-rata Statistik berdasarkan Role</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={avgStatsByRole}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="role" stroke="#888" fontSize={12} />
                <YAxis stroke="#888" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(26, 26, 46, 0.95)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    padding: '10px 14px',
                  }}
                  labelStyle={{ color: '#fff', fontWeight: 600 }}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Bar dataKey="winRate" fill="#10b981" name="Win Rate %" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pickRate" fill="#f59e0b" name="Pick Rate %" radius={[4, 4, 0, 0]} />
                <Bar dataKey="banRate" fill="#ef4444" name="Ban Rate %" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      </section>

      {/* Top Heroes Lists */}
      <section className="py-8 pb-16">
        <div className="container mx-auto px-6 lg:px-8">
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="text-xl font-semibold text-white mb-6"
          >
            Performa Terbaik
          </motion.h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top Win Rate */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="bg-dark-300/50 border border-white/5 rounded-2xl overflow-hidden"
            >
              <div className="bg-gradient-to-r from-green-500/20 to-transparent p-4 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <Award className="w-4 h-4 text-green-400" />
                  </div>
                  <h3 className="font-semibold text-white">Win Rate Tertinggi</h3>
                </div>
              </div>
              <div className="p-4 space-y-2">
                {topWinRateHeroes.map((hero, index) => (
                  <Link
                    key={hero.name}
                    to="/heroes/$heroId"
                    params={{ heroId: hero.heroId.toString() }}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors group"
                  >
                    <span className="text-sm font-bold text-gray-500 w-5">{index + 1}</span>
                    <img src={hero.icon} alt={hero.name} className="w-10 h-10 rounded-lg" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate group-hover:text-primary-400 transition-colors text-sm">
                        {hero.name}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-green-400">{hero.winRate.toFixed(1)}%</span>
                  </Link>
                ))}
              </div>
            </motion.div>

            {/* Top Pick Rate */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
              className="bg-dark-300/50 border border-white/5 rounded-2xl overflow-hidden"
            >
              <div className="bg-gradient-to-r from-yellow-500/20 to-transparent p-4 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-yellow-400" />
                  </div>
                  <h3 className="font-semibold text-white">Paling Banyak Dipilih</h3>
                </div>
              </div>
              <div className="p-4 space-y-2">
                {topPickRateHeroes.map((hero, index) => (
                  <Link
                    key={hero.name}
                    to="/heroes/$heroId"
                    params={{ heroId: hero.heroId.toString() }}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors group"
                  >
                    <span className="text-sm font-bold text-gray-500 w-5">{index + 1}</span>
                    <img src={hero.icon} alt={hero.name} className="w-10 h-10 rounded-lg" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate group-hover:text-primary-400 transition-colors text-sm">
                        {hero.name}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-yellow-400">{hero.pickRate.toFixed(1)}%</span>
                  </Link>
                ))}
              </div>
            </motion.div>

            {/* Top Ban Rate */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="bg-dark-300/50 border border-white/5 rounded-2xl overflow-hidden"
            >
              <div className="bg-gradient-to-r from-red-500/20 to-transparent p-4 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center">
                    <Ban className="w-4 h-4 text-red-400" />
                  </div>
                  <h3 className="font-semibold text-white">Paling Banyak Di-ban</h3>
                </div>
              </div>
              <div className="p-4 space-y-2">
                {topBanRateHeroes.map((hero, index) => (
                  <Link
                    key={hero.name}
                    to="/heroes/$heroId"
                    params={{ heroId: hero.heroId.toString() }}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors group"
                  >
                    <span className="text-sm font-bold text-gray-500 w-5">{index + 1}</span>
                    <img src={hero.icon} alt={hero.name} className="w-10 h-10 rounded-lg" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate group-hover:text-primary-400 transition-colors text-sm">
                        {hero.name}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-red-400">{hero.banRate.toFixed(1)}%</span>
                  </Link>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
