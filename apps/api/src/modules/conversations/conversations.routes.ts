import { Router } from 'express';
import { createConversationSchema } from '@pulse/shared';
import type { Env } from '../../config/env.js';
import { authenticate } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { ConversationService } from './conversations.service.js';

export function createConversationsRouter(env: Env) {
  const router = Router();
  const service = new ConversationService();

  router.use(authenticate(env));

  router.get('/workspaces/:workspaceId/conversations', async (req, res, next) => {
    try {
      const data = await service.list(req.user!.sub, String(req.params.workspaceId));
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  });

  router.post(
    '/workspaces/:workspaceId/conversations',
    validate(createConversationSchema),
    async (req, res, next) => {
      try {
        const data = await service.create(req.user!.sub, String(req.params.workspaceId), req.body);
        res.status(201).json({ success: true, data });
      } catch (err) {
        next(err);
      }
    },
  );

  router.get('/conversations/:conversationId', async (req, res, next) => {
    try {
      const data = await service.get(req.user!.sub, String(req.params.conversationId));
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  });

  router.post('/conversations/:conversationId/read', async (req, res, next) => {
    try {
      const data = await service.markRead(
        req.user!.sub,
        String(req.params.conversationId),
        String(req.body.messageId ?? ''),
      );
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
