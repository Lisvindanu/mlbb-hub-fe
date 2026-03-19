import { useQuery } from '@tanstack/react-query';
import { fetchAllHeroes, fetchHeroByName, fetchHeroById } from '../api/heroes';

export function useHeroes() {
  return useQuery({
    queryKey: ['heroes', 'v11'],
    queryFn: fetchAllHeroes,
    staleTime: 0,
  });
}

export function useHeroByName(name: string) {
  return useQuery({
    queryKey: ['hero', name],
    queryFn: () => fetchHeroByName(name),
    enabled: !!name,
  });
}

export function useHeroById(id: number) {
  return useQuery({
    queryKey: ['hero', id],
    queryFn: () => fetchHeroById(id),
    enabled: !!id,
  });
}
