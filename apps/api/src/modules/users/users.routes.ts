import { Router } from 'express';
import { updateProfileSchema } from '@pulse/shared';
import type { Env } from '../../config/env.js';
import { notFound } from '../../lib/errors.js';
import { toUserDto } from '../../lib/mappers.js';
import { prisma } from '../../lib/prisma.js';
import { authenticate } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';

export function createUsersRouter(env: Env) {
  const router = Router();

  router.patch('/me', authenticate(env), validate(updateProfileSchema), async (req, res, next) => {
    try {
      const user = await prisma.user.update({
        where: { id: req.user!.sub },
        data: {
          displayName: req.body.displayName,
          statusMessage: req.body.statusMessage,
        },
      });
      res.json({ success: true, data: toUserDto(user) });
    } catch (err) {
      next(err);
    }
  });

  router.get('/search', authenticate(env), async (req, res, next) => {
    try {
      const q = String(req.query.q ?? '').trim();
      const workspaceId = String(req.query.workspaceId ?? '');
      if (!q || !workspaceId) {
        res.json({ success: true, data: [] });
        return;
      }

      const members = await prisma.workspaceMember.findMany({
        where: {
          workspaceId,
          user: {
            OR: [
              { displayName: { contains: q, mode: 'insensitive' } },
              { email: { contains: q, mode: 'insensitive' } },
            ],
          },
        },
        include: { user: true },
        take: 20,
      });

      res.json({ success: true, data: members.map((m) => toUserDto(m.user)) });
    } catch (err) {
      next(err);
    }
  });

  router.get('/:id', authenticate(env), async (req, res, next) => {
    try {
      const user = await prisma.user.findUnique({ where: { id: String(req.params.id) } });
      if (!user) throw notFound('User not found');
      res.json({ success: true, data: toUserDto(user) });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
