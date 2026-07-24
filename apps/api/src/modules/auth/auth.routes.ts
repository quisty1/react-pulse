import { Router } from 'express';
import { loginSchema, registerSchema } from '@pulse/shared';
import type { Env } from '../../config/env.js';
import { authenticate } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { AuthService } from './auth.service.js';

const REFRESH_COOKIE = 'pulse_refresh';

export function createAuthRouter(env: Env) {
  const router = Router();
  const service = new AuthService(env);

  const cookieOptions = {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: 'lax' as const,
    path: '/api/auth',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };

  router.post('/register', validate(registerSchema), async (req, res, next) => {
    try {
      const result = await service.register(req.body);
      res.cookie(REFRESH_COOKIE, result.refreshToken, cookieOptions);
      res.status(201).json({
        success: true,
        data: { accessToken: result.accessToken, user: result.user },
      });
    } catch (err) {
      next(err);
    }
  });

  router.post('/login', validate(loginSchema), async (req, res, next) => {
    try {
      const result = await service.login(req.body);
      res.cookie(REFRESH_COOKIE, result.refreshToken, cookieOptions);
      res.json({
        success: true,
        data: { accessToken: result.accessToken, user: result.user },
      });
    } catch (err) {
      next(err);
    }
  });

  router.post('/refresh', async (req, res, next) => {
    try {
      const result = await service.refresh(req.cookies?.[REFRESH_COOKIE]);
      res.cookie(REFRESH_COOKIE, result.refreshToken, cookieOptions);
      res.json({
        success: true,
        data: { accessToken: result.accessToken, user: result.user },
      });
    } catch (err) {
      next(err);
    }
  });

  router.post('/logout', async (req, res, next) => {
    try {
      await service.logout(req.cookies?.[REFRESH_COOKIE]);
      res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
      res.json({ success: true, data: { ok: true } });
    } catch (err) {
      next(err);
    }
  });

  router.get('/me', authenticate(env), async (req, res, next) => {
    try {
      const user = await service.me(req.user!.sub);
      res.json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

export { REFRESH_COOKIE };
