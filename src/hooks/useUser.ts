import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';

const API_BASE_URL = import.meta.env.DEV ? '' : 'https://mlbbapi.project-n.site';

export interface Contributor {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  hasDonorFrame?: boolean;
  totalContributions: number;
  totalTierLists: number;
  totalVotes: number;
  createdAt: string;
}

export function useUser() {
  const { token, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['user', API_BASE_URL],
    queryFn: async (): Promise<Contributor> => {
      const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }

      return response.json();
    },
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useUpdateProfile() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name?: string; email?: string }) => {
      const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update profile');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', API_BASE_URL] });
    },
  });
}

export function useUploadAvatar() {
  const { token, updateUser } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File): Promise<{ url: string }> => {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const img = new Image();
        const objUrl = URL.createObjectURL(file);
        img.onload = () => {
          URL.revokeObjectURL(objUrl);
          const maxSize = 256;
          const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/webp', 0.85));
        };
        img.onerror = () => { URL.revokeObjectURL(objUrl); reject(new Error('Gagal membaca gambar')); };
        img.src = objUrl;
      });
      const response = await fetch(`${API_BASE_URL}/api/user/avatar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ image: dataUrl }),
      });
      if (!response.ok) throw new Error((await response.json()).error || 'Upload gagal');
      return response.json();
    },
    onSuccess: (data) => {
      updateUser({ avatar: data.url });
      queryClient.invalidateQueries({ queryKey: ['user', API_BASE_URL] });
    },
  });
}

export function useChangePassword() {
  const { token } = useAuth();

  return useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const response = await fetch(`${API_BASE_URL}/api/user/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to change password');
      }

      return response.json();
    },
  });
}
