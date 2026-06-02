import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';

export function useDashboardMetrics(workspaceId: string | null) {
  return useQuery({
    queryKey: ['workspace', workspaceId, 'dashboard'],
    queryFn: async () => {
      if (!workspaceId) return null;
      const res = await api.get(`/workspaces/${workspaceId}/dashboard-metrics`);
      return res.data;
    },
    enabled: !!workspaceId,
  });
}

export function useAccounts(workspaceId: string | null) {
  return useQuery({
    queryKey: ['workspace', workspaceId, 'accounts'],
    queryFn: async () => {
      if (!workspaceId) return [];
      const res = await api.get(`/workspaces/${workspaceId}/accounts`);
      return res.data;
    },
    enabled: !!workspaceId,
  });
}

export function useCategories(workspaceId: string | null) {
  return useQuery({
    queryKey: ['workspace', workspaceId, 'categories'],
    queryFn: async () => {
      if (!workspaceId) return [];
      const res = await api.get(`/workspaces/${workspaceId}/categories`);
      return res.data;
    },
    enabled: !!workspaceId,
  });
}

export function useTransactions(workspaceId: string | null) {
  return useQuery({
    queryKey: ['workspace', workspaceId, 'transactions'],
    queryFn: async () => {
      if (!workspaceId) return [];
      const res = await api.get(`/workspaces/${workspaceId}/transactions`);
      return res.data;
    },
    enabled: !!workspaceId,
  });
}

export function useCreateTransaction(workspaceId: string | null) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post(`/workspaces/${workspaceId}/transactions`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceId, 'transactions'] });
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceId, 'dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceId, 'accounts'] });
    },
  });
}

export function useUpdateTransaction(workspaceId: string | null) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; description?: string; categoryId?: string; date?: string }) => {
      const res = await api.post(`/workspaces/${workspaceId}/transactions/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceId, 'transactions'] });
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceId, 'dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceId, 'accounts'] });
    },
  });
}

export function useDeleteTransaction(workspaceId: string | null) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/workspaces/${workspaceId}/transactions/${id}/delete`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceId, 'transactions'] });
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceId, 'dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceId, 'accounts'] });
    },
  });
}

export function useCreateAccount(workspaceId: string | null) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post(`/workspaces/${workspaceId}/accounts`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceId, 'accounts'] });
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceId, 'dashboard'] });
    },
  });
}

export function useUpdateAccount(workspaceId: string | null) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name?: string; type?: string; balance?: number }) => {
      const res = await api.post(`/workspaces/${workspaceId}/accounts/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceId, 'accounts'] });
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceId, 'dashboard'] });
    },
  });
}

export function useDeleteAccount(workspaceId: string | null) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/workspaces/${workspaceId}/accounts/${id}/delete`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceId, 'accounts'] });
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceId, 'dashboard'] });
    },
  });
}

export function useCreateCategory(workspaceId: string | null) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { name: string; icon: string; color: string }) => {
      const res = await api.post(`/workspaces/${workspaceId}/categories`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceId, 'categories'] });
    },
  });
}

export function useUpdateCategory(workspaceId: string | null) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name: string; icon?: string; color?: string }) => {
      const res = await api.post(`/workspaces/${workspaceId}/categories/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceId, 'categories'] });
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceId, 'transactions'] });
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceId, 'dashboard'] });
    },
  });
}

export function useDeleteCategory(workspaceId: string | null) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/workspaces/${workspaceId}/categories/${id}/delete`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceId, 'categories'] });
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceId, 'transactions'] });
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceId, 'dashboard'] });
    },
  });
}
