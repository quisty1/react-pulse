import { Router } from 'express';
import {
  createMessageSchema,
  messageCursorSchema,
  reactionSchema,
  updateMessageSchema,
} from '@pulse/shared';
import type { Env } from '../../config/env.js';
import { authenticate } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import type { Server as SocketServer } from 'socket.io';
import { SOCKET_EVENTS } from '@pulse/shared';
import { MessageService } from './messages.service.js';

export function createMessagesRouter(env: Env, io: SocketServer) {
  const router = Router();
  const service = new MessageService();

  router.use(authenticate(env));

  router.get('/channels/:channelId/messages', async (req, res, next) => {
    try {
      const query = messageCursorSchema.parse(req.query);
      const data = await service.listChannelMessages(req.user!.sub, String(req.params.channelId), {
        cursor: query.cursor,
        limit: query.limit,
        parentId: query.parentId,
      });
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  });

  router.post(
    '/channels/:channelId/messages',
    validate(createMessageSchema),
    async (req, res, next) => {
      try {
        const data = await service.createInChannel(
          req.user!.sub,
          String(req.params.channelId),
          req.body,
        );
        const room = `channel:${req.params.channelId}`;
        io.to(room).emit(SOCKET_EVENTS.MESSAGE_CREATED, data);
        res.status(201).json({ success: true, data });
      } catch (err) {
        next(err);
      }
    },
  );

  router.get('/conversations/:conversationId/messages', async (req, res, next) => {
    try {
      const query = messageCursorSchema.parse(req.query);
      const data = await service.listConversationMessages(
        req.user!.sub,
        String(req.params.conversationId),
        {
          cursor: query.cursor,
          limit: query.limit,
          parentId: query.parentId,
        },
      );
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  });

  router.post(
    '/conversations/:conversationId/messages',
    validate(createMessageSchema),
    async (req, res, next) => {
      try {
        const data = await service.createInConversation(
          req.user!.sub,
          String(req.params.conversationId),
          req.body,
        );
        io.to(`conversation:${req.params.conversationId}`).emit(
          SOCKET_EVENTS.MESSAGE_CREATED,
          data,
        );
        res.status(201).json({ success: true, data });
      } catch (err) {
        next(err);
      }
    },
  );

  router.patch('/messages/:messageId', validate(updateMessageSchema), async (req, res, next) => {
    try {
      const data = await service.update(req.user!.sub, String(req.params.messageId), req.body.body);
      const room = data.channelId
        ? `channel:${data.channelId}`
        : `conversation:${data.conversationId}`;
      io.to(room).emit(SOCKET_EVENTS.MESSAGE_UPDATED, data);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  });

  router.delete('/messages/:messageId', async (req, res, next) => {
    try {
      const data = await service.remove(req.user!.sub, String(req.params.messageId));
      const room = data.channelId
        ? `channel:${data.channelId}`
        : `conversation:${data.conversationId}`;
      io.to(room).emit(SOCKET_EVENTS.MESSAGE_DELETED, data);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  });

  router.post(
    '/messages/:messageId/reactions',
    validate(reactionSchema),
    async (req, res, next) => {
      try {
        const data = await service.toggleReaction(
          req.user!.sub,
          String(req.params.messageId),
          req.body.emoji,
        );
        const message = await service.getById(req.user!.sub, String(req.params.messageId));
        const room = message.channelId
          ? `channel:${message.channelId}`
          : `conversation:${message.conversationId}`;
        io.to(room).emit(
          data.added ? SOCKET_EVENTS.REACTION_ADDED : SOCKET_EVENTS.REACTION_REMOVED,
          data,
        );
        res.json({ success: true, data });
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}
