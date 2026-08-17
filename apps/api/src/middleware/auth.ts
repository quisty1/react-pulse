import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import type { Env } from '../config/env.js';
import { unauthorized } from '../lib/errors.js';

export interface AuthPayload {
  sub: string;
  email: string;
}

/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}
/* eslint-enable @typescript-eslint/no-namespace */

/** Required JWT authentication (Bearer access token) */
export function authenticate(env: Env) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      next(unauthorized());
      return;
    }
    const token = header.slice('Bearer '.length);
    try {
      const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as AuthPayload;
      req.user = payload;
      next();
    } catch {
      next(unauthorized('Invalid or expired access token'));
    }
  };
}

/** Optional JWT: an invalid token does not block the request */
export function optionalAuthenticate(env: Env) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      next();
      return;
    }
    const token = header.slice('Bearer '.length);
    try {
      req.user = jwt.verify(token, env.JWT_ACCESS_SECRET) as AuthPayload;
    } catch {
      // Ignore an invalid optional token
    }
    next();
  };
}
