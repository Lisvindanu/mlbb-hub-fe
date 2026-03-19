import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';

const API_BASE_URL = import.meta.env.DEV ? '' : 'https://mlbbapi.project-n.site';

export interface Contribution {
  id: string;
  contributorId: string;
  type: 'skin' | 'hero' | 'series' | 'counter';
  data: Record<string, unknown>;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export function useUserContributions() {
  const { token, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['userContributions', API_BASE_URL],
    queryFn: async (): Promise<Contribution[]> => {
      const response = await fetch(`${API_BASE_URL}/api/user/contributions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch contributions');
      }

      const data = await response.json();
      return data.contributions || [];
    },
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 2,
  });
}
