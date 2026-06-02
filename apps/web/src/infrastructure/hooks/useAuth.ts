import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { useAuthStore, User } from '../../core/store/auth.store';

export function useMe() {
  const setUser = useAuthStore((state) => state.setUser);
  return useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      try {
        const { data } = await api.get<User>('/auth/me');
        setUser(data);
        return data;
      } catch (err) {
        setUser(null);
        throw err;
      }
    },
    retry: false,
  });
}

export function useRegister() {
  const setUser = useAuthStore((state) => state.setUser);
  return useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await api.post<User>('/auth/register', payload);
      setUser(data);
      return data;
    },
  });
}

export function useLogin() {
  const setUser = useAuthStore((state) => state.setUser);
  return useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await api.post<User>('/auth/login', payload);
      setUser(data);
      return data;
    },
  });
}

export function useLogout() {
  const logoutStore = useAuthStore((state) => state.logout);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await api.post('/auth/logout');
      logoutStore();
      queryClient.clear();
    },
  });
}
