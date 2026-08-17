import { createServer } from 'node:http';
import { loadDotenv } from './config/load-dotenv.js';
import { loadEnv } from './config/env.js';
import { createLogger } from './config/logger.js';
import { createApp } from './app.js';
import { createSocketServer } from './socket/index.js';

// Load .env first, then Zod validation and HTTP + Socket.IO
loadDotenv();

const env = loadEnv();
const logger = createLogger(env);
const httpServer = createServer();
const io = createSocketServer(httpServer, env, logger);
const app = createApp(env, logger, io);

// One server for REST and websocket
httpServer.on('request', app);

httpServer.listen(env.API_PORT, env.API_HOST, () => {
  logger.info(`Pulse API listening on http://${env.API_HOST}:${env.API_PORT}`);
});
