import axios from 'axios';
import type { ApiResponse } from '@pulse/shared';
import { useAuthStore } from '@/features/auth';

const API_URL = import.meta.env.VITE_API_URL ?? '';

/** Axios-клиент к /api с cookie и Bearer */
export const api = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true,
  timeout: 20_000,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Один refresh на пачку параллельных 401
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = api
      .post<ApiResponse<{ accessToken: string }>>('/auth/refresh')
      .then((res) => {
        if (res.data.success) {
          useAuthStore.getState().setAccessToken(res.data.data.accessToken);
          return res.data.data.accessToken;
        }
        return null;
      })
      .catch(() => {
        useAuthStore.getState().clearSession();
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as (typeof error.config & { _retry?: boolean }) | undefined;
    // Повтор запроса один раз после успешного refresh
    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true;
      const token = await refreshAccessToken();
      if (token) {
        original.headers = original.headers ?? {};
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      }
    }
    return Promise.reject(error);
  },
);

/** Достаёт message из ApiError или AxiosError */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: { message?: string } } | undefined;
    return data?.error?.message ?? error.message;
  }
  if (error instanceof Error) return error.message;
  return 'Unexpected error';
}
