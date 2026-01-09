import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthState, User } from '@/types';

interface AuthStore extends AuthState {
  setUser: (user: User | null, token: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setUser: (user, token) =>
        set({
          user,
          token,
          isAuthenticated: !!user && !!token,
        }),
      logout: () =>
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'auth-store',
    }
  )
);
