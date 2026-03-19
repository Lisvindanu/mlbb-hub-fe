import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';

const API_BASE_URL = import.meta.env.DEV ? '' : 'https://mlbbapi.project-n.site';

export interface TierList {
  id: string;
  title: string;
  creatorName: string;
  tiers: Record<string, (string | number)[]>;
  votes: number;
  votedBy: string[];
  createdAt: string;
}

export function useUserTierLists() {
  const { token, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['userTierLists', API_BASE_URL],
    queryFn: async (): Promise<TierList[]> => {
      const response = await fetch(`${API_BASE_URL}/api/user/tier-lists`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch tier lists');
      }

      const data = await response.json();
      return data.tierLists || [];
    },
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 2,
  });
}
