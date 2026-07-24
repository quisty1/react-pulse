import { create } from 'zustand';
import type { UserDto } from '@pulse/shared';

interface AuthState {
  accessToken: string | null;
  user: UserDto | null;
  hydrated: boolean;
  setSession: (accessToken: string, user: UserDto) => void;
  setAccessToken: (accessToken: string) => void;
  setUser: (user: UserDto) => void;
  clearSession: () => void;
  setHydrated: (hydrated: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  hydrated: false,
  setSession: (accessToken, user) => set({ accessToken, user }),
  setAccessToken: (accessToken) => set({ accessToken }),
  setUser: (user) => set({ user }),
  clearSession: () => set({ accessToken: null, user: null }),
  setHydrated: (hydrated) => set({ hydrated }),
}));
