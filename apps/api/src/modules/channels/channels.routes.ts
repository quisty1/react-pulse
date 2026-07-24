import { Router } from 'express';
import { createChannelSchema, updateChannelSchema } from '@pulse/shared';
import type { Env } from '../../config/env.js';
import { authenticate } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { ChannelService } from './channels.service.js';

export function createChannelsRouter(env: Env) {
  const router = Router({ mergeParams: true });
  const service = new ChannelService();

  router.use(authenticate(env));

  router.get('/workspaces/:workspaceId/channels', async (req, res, next) => {
    try {
      const data = await service.list(req.user!.sub, String(req.params.workspaceId));
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  });

  router.post(
    '/workspaces/:workspaceId/channels',
    validate(createChannelSchema),
    async (req, res, next) => {
      try {
        const data = await service.create(req.user!.sub, String(req.params.workspaceId), req.body);
        res.status(201).json({ success: true, data });
      } catch (err) {
        next(err);
      }
    },
  );

  router.get('/channels/:channelId', async (req, res, next) => {
    try {
      const data = await service.get(req.user!.sub, String(req.params.channelId));
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  });

  router.patch('/channels/:channelId', validate(updateChannelSchema), async (req, res, next) => {
    try {
      const data = await service.update(req.user!.sub, String(req.params.channelId), req.body);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  });

  router.post('/channels/:channelId/join', async (req, res, next) => {
    try {
      const data = await service.join(req.user!.sub, String(req.params.channelId));
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  });

  router.post('/channels/:channelId/leave', async (req, res, next) => {
    try {
      const data = await service.leave(req.user!.sub, String(req.params.channelId));
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  });

  router.delete('/channels/:channelId', async (req, res, next) => {
    try {
      const data = await service.remove(req.user!.sub, String(req.params.channelId));
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  });

  router.get('/channels/:channelId/members', async (req, res, next) => {
    try {
      const data = await service.listMembers(req.user!.sub, String(req.params.channelId));
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  });

  router.post('/channels/:channelId/read', async (req, res, next) => {
    try {
      const messageId = String(req.body.messageId ?? '');
      const data = await service.markRead(req.user!.sub, String(req.params.channelId), messageId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
