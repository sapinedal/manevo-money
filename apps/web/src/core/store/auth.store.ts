import { create } from 'zustand';

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  avatarUrl: string | null;
}

export interface Membership {
  id: string;
  role: string;
  workspaceId: string;
  workspace: Workspace;
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  memberships: Membership[];
}

interface AuthState {
  user: User | null;
  activeWorkspaceId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setActiveWorkspaceId: (workspaceId: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  activeWorkspaceId: null,
  isAuthenticated: false,
  isLoading: true,
  setUser: (user) => set({
    user,
    isAuthenticated: !!user,
    isLoading: false,
    activeWorkspaceId: user?.memberships[0]?.workspaceId || null,
  }),
  setActiveWorkspaceId: (workspaceId) => set({ activeWorkspaceId: workspaceId }),
  logout: () => set({ user: null, isAuthenticated: false, activeWorkspaceId: null, isLoading: false }),
}));
