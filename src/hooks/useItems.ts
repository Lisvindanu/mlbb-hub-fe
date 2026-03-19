import { useQuery } from '@tanstack/react-query';
import { fetchAllItems, fetchAllArcana } from '../api/items';

export function useItems() {
  return useQuery({
    queryKey: ['items'],
    queryFn: fetchAllItems,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

export function useArcana() {
  return useQuery({
    queryKey: ['arcana'],
    queryFn: fetchAllArcana,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}
