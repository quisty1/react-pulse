import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ApiResponse, AuthTokensDto, LoginInput, RegisterInput, UserDto } from '@pulse/shared';
import { api } from '@/shared/api';
import { useAuthStore } from '../model/auth-store';

export function useLogin() {
  const setSession = useAuthStore((s) => s.setSession);
  return useMutation({
    mutationFn: async (input: LoginInput) => {
      const { data } = await api.post<ApiResponse<AuthTokensDto>>('/auth/login', input);
      if (!data.success) throw new Error(data.error.message);
      return data.data;
    },
    onSuccess: (data) => setSession(data.accessToken, data.user),
  });
}

export function useRegister() {
  const setSession = useAuthStore((s) => s.setSession);
  return useMutation({
    mutationFn: async (input: RegisterInput) => {
      const { data } = await api.post<ApiResponse<AuthTokensDto>>('/auth/register', input);
      if (!data.success) throw new Error(data.error.message);
      return data.data;
    },
    onSuccess: (data) => setSession(data.accessToken, data.user),
  });
}

export function useLogout() {
  const clearSession = useAuthStore((s) => s.clearSession);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await api.post('/auth/logout');
    },
    onSettled: () => {
      clearSession();
      qc.clear();
    },
  });
}

export function useRestoreSession() {
  const setSession = useAuthStore((s) => s.setSession);
  const clearSession = useAuthStore((s) => s.clearSession);
  const setHydrated = useAuthStore((s) => s.setHydrated);

  return useQuery({
    queryKey: ['auth', 'session'],
    queryFn: async () => {
      try {
        const { data } = await api.post<ApiResponse<AuthTokensDto>>('/auth/refresh');
        if (!data.success) {
          clearSession();
          return null;
        }
        setSession(data.data.accessToken, data.data.user);
        return data.data;
      } catch {
        clearSession();
        return null;
      } finally {
        setHydrated(true);
      }
    },
    staleTime: Infinity,
    retry: false,
  });
}

export function useUpdateProfile() {
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: async (input: { displayName?: string; statusMessage?: string | null }) => {
      const { data } = await api.patch<ApiResponse<UserDto>>('/users/me', input);
      if (!data.success) throw new Error(data.error.message);
      return data.data;
    },
    onSuccess: (user) => setUser(user),
  });
}
