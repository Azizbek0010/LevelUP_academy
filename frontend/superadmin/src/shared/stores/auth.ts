import { create } from 'zustand';
import type { Role } from '@/shared/types';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
}

interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  status: 'idle' | 'loading' | 'authenticated' | 'unauthenticated';
  setAuth: (token: string, user: AuthUser) => void;
  setToken: (token: string) => void;
  setUser: (user: AuthUser) => void;
  clear: () => void;
  setStatus: (status: AuthState['status']) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  status: 'idle',
  setAuth: (accessToken, user) => set({ accessToken, user, status: 'authenticated' }),
  setToken: (accessToken) => set({ accessToken }),
  setUser: (user) => set({ user }),
  clear: () => set({ accessToken: null, user: null, status: 'unauthenticated' }),
  setStatus: (status) => set({ status }),
}));

// Non-hook accessor for use inside http client / interceptors.
export const authStore = {
  getToken: () => useAuthStore.getState().accessToken,
  setToken: (t: string) => useAuthStore.getState().setToken(t),
  clear: () => useAuthStore.getState().clear(),
};
