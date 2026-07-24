import { Router } from 'express';
import type { Env } from '../../config/env.js';
import { prisma } from '../../lib/prisma.js';
import { authenticate } from '../../middleware/auth.js';

export function createNotificationsRouter(env: Env) {
  const router = Router();

  router.use(authenticate(env));

  router.get('/notifications', async (req, res, next) => {
    try {
      const items = await prisma.notification.findMany({
        where: { userId: req.user!.sub },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
      res.json({
        success: true,
        data: items.map((n) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          body: n.body,
          read: n.read,
          workspaceId: n.workspaceId,
          channelId: n.channelId,
          conversationId: n.conversationId,
          messageId: n.messageId,
          createdAt: n.createdAt.toISOString(),
        })),
      });
    } catch (err) {
      next(err);
    }
  });

  router.get('/notifications/mentions', async (req, res, next) => {
    try {
      const items = await prisma.notification.findMany({
        where: { userId: req.user!.sub, type: 'MENTION' },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
      res.json({
        success: true,
        data: items.map((n) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          body: n.body,
          read: n.read,
          workspaceId: n.workspaceId,
          channelId: n.channelId,
          conversationId: n.conversationId,
          messageId: n.messageId,
          createdAt: n.createdAt.toISOString(),
        })),
      });
    } catch (err) {
      next(err);
    }
  });

  router.post('/notifications/:id/read', async (req, res, next) => {
    try {
      await prisma.notification.updateMany({
        where: { id: String(req.params.id), userId: req.user!.sub },
        data: { read: true },
      });
      res.json({ success: true, data: { ok: true } });
    } catch (err) {
      next(err);
    }
  });

  router.post('/notifications/read-all', async (req, res, next) => {
    try {
      await prisma.notification.updateMany({
        where: { userId: req.user!.sub, read: false },
        data: { read: true },
      });
      res.json({ success: true, data: { ok: true } });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
