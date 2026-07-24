import { describe, expect, it } from 'vitest';
import { loginSchema, registerSchema } from './auth.js';

describe('auth schemas', () => {
  it('accepts valid registration', () => {
    const result = registerSchema.safeParse({
      email: 'user@pulse.app',
      password: 'SecurePass1',
      displayName: 'User',
    });
    expect(result.success).toBe(true);
  });

  it('rejects weak password', () => {
    const result = registerSchema.safeParse({
      email: 'user@pulse.app',
      password: 'weak',
      displayName: 'User',
    });
    expect(result.success).toBe(false);
  });

  it('requires email for login', () => {
    const result = loginSchema.safeParse({ email: 'bad', password: 'x' });
    expect(result.success).toBe(false);
  });
});
