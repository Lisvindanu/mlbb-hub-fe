import type { ApiResponse, Hero } from '../types/hero';

// In development use Vite proxy (to avoid CORS), in production use direct VPS URL
const API_BASE_URL = import.meta.env.DEV ? '' : 'https://mlbbapi.project-n.site';

export async function fetchAllHeroes(): Promise<Hero[]> {
  const response = await fetch(`${API_BASE_URL}/api/hok`);

  if (!response.ok) {
    throw new Error('Failed to fetch heroes');
  }

  const data: ApiResponse = await response.json();

  // Convert main object to array
  return Object.values(data.main);
}

export async function fetchHeroByName(name: string): Promise<Hero | null> {
  const heroes = await fetchAllHeroes();
  return heroes.find(hero => hero.name === name) || null;
}

export async function fetchHeroById(id: number): Promise<Hero | null> {
  const heroes = await fetchAllHeroes();
  return heroes.find(hero => hero.heroId === id) || null;
}

export async function fetchApiStatus(): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/api/status`);

  if (!response.ok) {
    throw new Error('Failed to fetch API status');
  }

  return response.json();
}

export async function fetchHealthCheck(): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/health`);

  if (!response.ok) {
    throw new Error('Failed to fetch health status');
  }

  return response.json();
}

// Adjustments/Patch Notes types
export interface SkillChange {
  skillName: string;
  skillIcon: string;
  skillIndex: string;
  title: string;
  description: string;
}

export interface HeroAdjustment {
  heroId: number;
  heroName: string;
  heroIcon: string;
  shortDesc: string;
  type: 'Stat Buffs' | 'Stat Changes' | 'Stat Nerfs' | string;
  tagEnum: number;
  tagColor: string;
  versionName?: string;
  versionPublishTime?: string;
  stats: {
    winRate: number;
    pickRate: number;
    banRate: number;
  };
  skillChanges: SkillChange[];
}

export interface AdjustmentsResponse {
  scrapedAt: string;
  season: {
    id: string;
    name: string;
  };
  adjustments: HeroAdjustment[];
}

export interface SeasonAdjustments {
  season: { id: string; name: string };
  adjustments: HeroAdjustment[];
  heroCount: number;
}

export interface AdjustmentsFullResponse {
  scrapedAt: string;
  currentSeason: { id: string; name: string };
  allSeasons: Record<string, SeasonAdjustments>;
}

export async function fetchAdjustmentsFull(): Promise<AdjustmentsFullResponse> {
  const response = await fetch(`${API_BASE_URL}/api/adjustments/full`);

  if (!response.ok) {
    throw new Error('Failed to fetch full adjustments');
  }

  return response.json();
}

export async function fetchAdjustments(seasonId?: string): Promise<AdjustmentsResponse> {
  const url = seasonId
    ? `${API_BASE_URL}/api/adjustments?season=${seasonId}`
    : `${API_BASE_URL}/api/adjustments`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Failed to fetch adjustments');
  }

  return response.json();
}
