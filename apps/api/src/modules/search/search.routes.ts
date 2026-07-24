import { Router } from 'express';
import { searchMessagesSchema } from '@pulse/shared';
import type { Env } from '../../config/env.js';
import { toUserDto } from '../../lib/mappers.js';
import { prisma } from '../../lib/prisma.js';
import { authenticate } from '../../middleware/auth.js';
import { WorkspaceService } from '../workspaces/workspaces.service.js';

export function createSearchRouter(env: Env) {
  const router = Router();
  const workspaces = new WorkspaceService();

  router.use(authenticate(env));

  router.get('/workspaces/:workspaceId/search', async (req, res, next) => {
    try {
      const workspaceId = String(req.params.workspaceId);
      await workspaces.requireMembership(req.user!.sub, workspaceId);
      const query = searchMessagesSchema.parse(req.query);

      const messages = await prisma.message.findMany({
        where: {
          body: { contains: query.q, mode: 'insensitive' },
          authorId: query.userId,
          createdAt: {
            gte: query.from ? new Date(query.from) : undefined,
            lte: query.to ? new Date(query.to) : undefined,
          },
          OR: [
            {
              channelId: query.channelId,
              channel: {
                workspaceId,
                OR: [{ type: 'PUBLIC' }, { members: { some: { userId: req.user!.sub } } }],
              },
            },
            {
              conversation: {
                workspaceId,
                members: { some: { userId: req.user!.sub } },
              },
            },
          ],
        },
        include: {
          author: true,
          channel: true,
          conversation: true,
        },
        orderBy: { createdAt: 'desc' },
        take: query.limit,
      });

      res.json({
        success: true,
        data: messages.map((m) => ({
          id: m.id,
          body: m.body,
          createdAt: m.createdAt.toISOString(),
          author: toUserDto(m.author),
          channelId: m.channelId,
          conversationId: m.conversationId,
          channelName: m.channel?.name ?? null,
        })),
      });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
