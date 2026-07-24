import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import type { Server as SocketServer } from 'socket.io';
import type { Env } from './config/env.js';
import type { Logger } from './config/logger.js';
import { openApiDocument } from './docs/openapi.js';
import { errorHandler } from './middleware/error-handler.js';
import { createAuthRouter } from './modules/auth/auth.routes.js';
import { createChannelsRouter } from './modules/channels/channels.routes.js';
import { createConversationsRouter } from './modules/conversations/conversations.routes.js';
import { createFilesRouter } from './modules/files/files.routes.js';
import { createMessagesRouter } from './modules/messages/messages.routes.js';
import { createNotificationsRouter } from './modules/notifications/notifications.routes.js';
import { createSearchRouter } from './modules/search/search.routes.js';
import { createUsersRouter } from './modules/users/users.routes.js';
import { createWorkspacesRouter } from './modules/workspaces/workspaces.routes.js';

/** Собирает Express-приложение: middleware, роуты, swagger, error handler */
export function createApp(env: Env, logger: Logger, io: SocketServer) {
  const app = express();

  // Нужно за reverse-proxy для корректных IP в rate limit
  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN.split(',').map((o) => o.trim()),
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  // Общий лимит запросов
  app.use(
    rateLimit({
      windowMs: env.RATE_LIMIT_WINDOW_MS,
      max: env.RATE_LIMIT_MAX,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  // Более жёсткий лимит на auth-эндпоинты
  const authLimiter = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.AUTH_RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.get('/health', (_req, res) => {
    res.json({ ok: true, service: 'pulse-api' });
  });

  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));
  app.use('/api/auth', authLimiter, createAuthRouter(env));
  app.use('/api/users', createUsersRouter(env));
  app.use('/api/workspaces', createWorkspacesRouter(env));
  app.use('/api', createChannelsRouter(env));
  app.use('/api', createConversationsRouter(env));
  // io нужен для realtime-событий при создании сообщений
  app.use('/api', createMessagesRouter(env, io));
  app.use('/api', createFilesRouter(env));
  app.use('/api', createNotificationsRouter(env));
  app.use('/api', createSearchRouter(env));

  app.use(errorHandler(logger));
  return app;
}
