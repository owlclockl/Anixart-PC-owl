import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Profile {
  id: number;
  login: string;
  avatar?: string;
  status?: string;
  isVerified?: boolean;
  isSponsor?: boolean;
}

interface AuthStore {
  token: string | null;
  tokenId: number | null;
  profile: Profile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  setToken: (token: string, id: number) => void;
  setProfile: (profile: Profile) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      token: null,
      tokenId: null,
      profile: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      setToken: (token, id) =>
        set({
          token,
          tokenId: id,
          isAuthenticated: true,
          error: null,
        }),

      setProfile: (profile) => set({ profile }),

      logout: () =>
        set({
          token: null,
          tokenId: null,
          profile: null,
          isAuthenticated: false,
          error: null,
        }),

      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
    }),
    {
      name: 'anidesk-auth-v2',
      partialize: (state) => ({
        token: state.token,
        tokenId: state.tokenId,
        profile: state.profile,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
