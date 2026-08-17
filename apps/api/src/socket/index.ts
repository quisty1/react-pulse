import type { Server as HttpServer } from 'node:http';
import jwt from 'jsonwebtoken';
import { Server } from 'socket.io';
import { SOCKET_EVENTS } from '@pulse/shared';
import type { Env } from '../config/env.js';
import type { Logger } from '../config/logger.js';
import type { AuthPayload } from '../middleware/auth.js';

// userId → set of socket.id (multiple tabs of the same user)
const onlineUsers = new Map<string, Set<string>>();

/** Socket.IO: JWT on handshake, workspace/channel/conversation rooms, presence */
export function createSocketServer(httpServer: HttpServer, env: Env, logger: Logger) {
  const io = new Server(httpServer, {
    cors: {
      origin: env.CORS_ORIGIN.split(',').map((o) => o.trim()),
      credentials: true,
    },
  });

  // Token from auth.token or Authorization header
  io.use((socket, next) => {
    const token =
      (socket.handshake.auth?.token as string | undefined) ??
      (socket.handshake.headers.authorization?.startsWith('Bearer ')
        ? socket.handshake.headers.authorization.slice(7)
        : undefined);

    if (!token) {
      next(new Error('Unauthorized'));
      return;
    }

    try {
      const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as AuthPayload;
      socket.data.user = payload;
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on(SOCKET_EVENTS.CONNECTION, (socket) => {
    const user = socket.data.user as AuthPayload;
    logger.debug({ userId: user.sub }, 'socket connected');

    const sockets = onlineUsers.get(user.sub) ?? new Set();
    sockets.add(socket.id);
    onlineUsers.set(user.sub, sockets);
    io.emit(SOCKET_EVENTS.PRESENCE_UPDATE, { userId: user.sub, status: 'online' });

    socket.on(SOCKET_EVENTS.JOIN_WORKSPACE, (workspaceId: string) => {
      socket.join(`workspace:${workspaceId}`);
    });

    socket.on(SOCKET_EVENTS.LEAVE_WORKSPACE, (workspaceId: string) => {
      socket.leave(`workspace:${workspaceId}`);
    });

    socket.on(SOCKET_EVENTS.JOIN_CHANNEL, (channelId: string) => {
      socket.join(`channel:${channelId}`);
    });

    socket.on(SOCKET_EVENTS.LEAVE_CHANNEL, (channelId: string) => {
      socket.leave(`channel:${channelId}`);
    });

    socket.on(SOCKET_EVENTS.JOIN_CONVERSATION, (conversationId: string) => {
      socket.join(`conversation:${conversationId}`);
    });

    socket.on(SOCKET_EVENTS.LEAVE_CONVERSATION, (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
    });

    socket.on(
      SOCKET_EVENTS.TYPING_START,
      (payload: { channelId?: string; conversationId?: string }) => {
        const room = payload.channelId
          ? `channel:${payload.channelId}`
          : payload.conversationId
            ? `conversation:${payload.conversationId}`
            : null;
        if (!room) return;
        socket.to(room).emit(SOCKET_EVENTS.TYPING_START, {
          userId: user.sub,
          ...payload,
        });
      },
    );

    socket.on(
      SOCKET_EVENTS.TYPING_STOP,
      (payload: { channelId?: string; conversationId?: string }) => {
        const room = payload.channelId
          ? `channel:${payload.channelId}`
          : payload.conversationId
            ? `conversation:${payload.conversationId}`
            : null;
        if (!room) return;
        socket.to(room).emit(SOCKET_EVENTS.TYPING_STOP, {
          userId: user.sub,
          ...payload,
        });
      },
    );

    socket.on(SOCKET_EVENTS.DISCONNECT, () => {
      const set = onlineUsers.get(user.sub);
      set?.delete(socket.id);
      // Offline only when all of the user's tabs are closed
      if (set && set.size === 0) {
        onlineUsers.delete(user.sub);
        io.emit(SOCKET_EVENTS.PRESENCE_UPDATE, { userId: user.sub, status: 'offline' });
      }
      logger.debug({ userId: user.sub }, 'socket disconnected');
    });
  });

  return io;
}

/** userIds that have at least one active connection */
export function getOnlineUserIds() {
  return [...onlineUsers.keys()];
}
