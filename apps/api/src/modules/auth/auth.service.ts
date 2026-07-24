import { createHash } from 'node:crypto';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import type { Env } from '../../config/env.js';
import { conflict, unauthorized } from '../../lib/errors.js';
import { toUserDto } from '../../lib/mappers.js';
import { prisma } from '../../lib/prisma.js';
import type { AuthPayload } from '../../middleware/auth.js';

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

function parseDurationMs(value: string): number {
  const match = /^(\d+)([smhd])$/.exec(value);
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const amount = Number(match[1]);
  const unit = match[2];
  const mult = unit === 's' ? 1000 : unit === 'm' ? 60_000 : unit === 'h' ? 3_600_000 : 86_400_000;
  return amount * mult;
}

export class AuthService {
  constructor(private readonly env: Env) {}

  async register(input: { email: string; password: string; displayName: string }) {
    const existing = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
    if (existing) throw conflict('Email already registered');

    const passwordHash = await argon2.hash(input.password);
    const user = await prisma.user.create({
      data: {
        email: input.email.toLowerCase(),
        passwordHash,
        displayName: input.displayName,
      },
    });

    return this.issueSession(user.id, user.email);
  }

  async login(input: { email: string; password: string }) {
    const user = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
    if (!user) throw unauthorized('Invalid email or password');

    const valid = await argon2.verify(user.passwordHash, input.password);
    if (!valid) throw unauthorized('Invalid email or password');

    return this.issueSession(user.id, user.email);
  }

  async refresh(refreshToken: string | undefined) {
    if (!refreshToken) throw unauthorized('Missing refresh token');

    let payload: AuthPayload;
    try {
      payload = jwt.verify(refreshToken, this.env.JWT_REFRESH_SECRET) as AuthPayload;
    } catch {
      throw unauthorized('Invalid refresh token');
    }

    const tokenHash = hashToken(refreshToken);
    const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });
    if (!stored || stored.userId !== payload.sub || stored.expiresAt < new Date()) {
      throw unauthorized('Refresh token revoked or expired');
    }

    await prisma.refreshToken.delete({ where: { id: stored.id } });
    const user = await prisma.user.findUniqueOrThrow({ where: { id: payload.sub } });
    return this.issueSession(user.id, user.email);
  }

  async logout(refreshToken: string | undefined) {
    if (!refreshToken) return;
    const tokenHash = hashToken(refreshToken);
    await prisma.refreshToken.deleteMany({ where: { tokenHash } });
  }

  async me(userId: string) {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    return toUserDto(user);
  }

  private async issueSession(userId: string, email: string) {
    const accessToken = jwt.sign({ sub: userId, email }, this.env.JWT_ACCESS_SECRET, {
      expiresIn: this.env.JWT_ACCESS_EXPIRES_IN,
    } as jwt.SignOptions);

    const refreshToken = jwt.sign({ sub: userId, email }, this.env.JWT_REFRESH_SECRET, {
      expiresIn: this.env.JWT_REFRESH_EXPIRES_IN,
    } as jwt.SignOptions);

    await prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: hashToken(refreshToken),
        expiresAt: new Date(Date.now() + parseDurationMs(this.env.JWT_REFRESH_EXPIRES_IN)),
      },
    });

    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    return {
      accessToken,
      refreshToken,
      user: toUserDto(user),
    };
  }
}
