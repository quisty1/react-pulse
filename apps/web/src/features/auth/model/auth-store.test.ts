import { describe, expect, it } from 'vitest';
import { useAuthStore } from '@/features/auth';

describe('auth store', () => {
  it('stores access token in memory only', () => {
    useAuthStore.getState().clearSession();
    useAuthStore.getState().setSession('token', {
      id: '1',
      email: 'a@b.c',
      displayName: 'A',
      avatarUrl: null,
      statusMessage: null,
      createdAt: new Date().toISOString(),
    });
    expect(useAuthStore.getState().accessToken).toBe('token');
    expect(localStorage.getItem('accessToken')).toBeNull();
  });
});
