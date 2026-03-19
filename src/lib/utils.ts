import { type ClassValue, clsx } from 'clsx';
import type { Hero, HeroFilter, HeroSortOption, TierRank } from '../types/hero';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function filterHeroes(heroes: Hero[], filter: HeroFilter): Hero[] {
  let filtered = [...heroes];

  if (filter.role && filter.role !== 'All') {
    filtered = filtered.filter(hero => hero.role === filter.role);
  }

  if (filter.lane && filter.lane !== 'All') {
    filtered = filtered.filter(hero =>
      hero.lanes?.includes(filter.lane as string) || hero.lane === filter.lane
    );
  }

  if (filter.specialty && filter.specialty !== 'All') {
    filtered = filtered.filter(hero =>
      hero.speciality?.includes(filter.specialty as string)
    );
  }

  if (filter.search) {
    const search = filter.search.toLowerCase();
    filtered = filtered.filter(hero =>
      hero.name.toLowerCase().includes(search) ||
      hero.title.toLowerCase().includes(search)
    );
  }

  return filtered;
}

export function sortHeroes(heroes: Hero[], sortOption: HeroSortOption): Hero[] {
  const sorted = [...heroes];

  sorted.sort((a, b) => {
    let comparison = 0;

    switch (sortOption.field) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'winRate':
        comparison = parseFloat(a.stats.winRate) - parseFloat(b.stats.winRate);
        break;
      case 'pickRate':
        comparison = parseFloat(a.stats.pickRate) - parseFloat(b.stats.pickRate);
        break;
      case 'banRate':
        comparison = parseFloat(a.stats.banRate) - parseFloat(b.stats.banRate);
        break;
      case 'tier':
        comparison = getTierValue(a.stats.tier as TierRank) - getTierValue(b.stats.tier as TierRank);
        break;
    }

    return sortOption.order === 'asc' ? comparison : -comparison;
  });

  return sorted;
}

function getTierValue(tier: TierRank): number {
  const tierMap: Record<TierRank, number> = {
    'S+': 6,
    'S': 5,
    'A': 4,
    'B': 3,
    'C': 2,
    'D': 1,
  };
  return tierMap[tier] || 0;
}

export function getRoleColor(role: string): string {
  const roleColors: Record<string, string> = {
    'Tank': 'text-blue-400',
    'Fighter': 'text-red-400',
    'Assassin': 'text-purple-400',
    'Mage': 'text-cyan-400',
    'Marksman': 'text-yellow-400',
    'Support': 'text-green-400',
  };
  return roleColors[role] || 'text-gray-400';
}

export function getRoleIcon(role: string): string {
  const roleIcons: Record<string, string> = {
    'Tank': '🛡️',
    'Fighter': '⚔️',
    'Assassin': '🗡️',
    'Mage': '✨',
    'Marksman': '🏹',
    'Support': '💚',
  };
  return roleIcons[role] || '❓';
}

export function getTierColor(tier: string): string {
  const tierColors: Record<string, string> = {
    'S+': 'text-red-500',
    'S': 'text-orange-500',
    'A': 'text-yellow-500',
    'B': 'text-green-500',
    'C': 'text-blue-500',
    'D': 'text-gray-500',
  };
  return tierColors[tier] || 'text-gray-400';
}

export function formatPercentage(value: string): number {
  return parseFloat(value.replace('%', ''));
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
