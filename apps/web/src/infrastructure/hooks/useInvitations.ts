import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';

export function useWorkspaceInvitations(workspaceId: string | null) {
  return useQuery({
    queryKey: ['workspace', workspaceId, 'invitations'],
    queryFn: async () => {
      if (!workspaceId) return [];
      const res = await api.get(`/workspaces/${workspaceId}/invitations`);
      return res.data;
    },
    enabled: !!workspaceId,
  });
}

export function useCreateInvitation(workspaceId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { email: string; role: string }) => {
      const res = await api.post(`/workspaces/${workspaceId}/invitations`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['workspace', workspaceId, 'invitations'],
      });
    },
  });
}

export function useRevokeInvitation(workspaceId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invitationId: string) => {
      const res = await api.post(`/workspaces/${workspaceId}/invitations/${invitationId}/delete`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['workspace', workspaceId, 'invitations'],
      });
    },
  });
}

export function useInvitationDetails(token: string | undefined) {
  return useQuery({
    queryKey: ['invitation', token],
    queryFn: async () => {
      if (!token) return null;
      const res = await api.get(`/invitations/${token}`);
      return res.data;
    },
    enabled: !!token,
    retry: false,
  });
}

export function useAcceptInvitation() {
  return useMutation({
    mutationFn: async (token: string) => {
      const res = await api.post(`/invitations/${token}/accept`);
      return res.data;
    },
  });
}

export function useDeclineInvitation() {
  return useMutation({
    mutationFn: async (token: string) => {
      const res = await api.post(`/invitations/${token}/decline`);
      return res.data;
    },
  });
}
