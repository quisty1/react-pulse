/** Roles, entity types, file limits, socket events */

export const WORKSPACE_ROLES = ['OWNER', 'ADMIN', 'MEMBER'] as const;
export type WorkspaceRole = (typeof WORKSPACE_ROLES)[number];

export const CHANNEL_TYPES = ['PUBLIC', 'PRIVATE'] as const;
export type ChannelType = (typeof CHANNEL_TYPES)[number];

export const CONVERSATION_TYPES = ['DIRECT', 'GROUP'] as const;
export type ConversationType = (typeof CONVERSATION_TYPES)[number];

export const NOTIFICATION_TYPES = [
  'MENTION',
  'REPLY',
  'REACTION',
  'INVITE',
  'CHANNEL_MESSAGE',
  'DM',
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'application/zip',
] as const;

/** Socket.IO event names (must match on client and server) */
export const SOCKET_EVENTS = {
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  JOIN_WORKSPACE: 'workspace:join',
  LEAVE_WORKSPACE: 'workspace:leave',
  JOIN_CHANNEL: 'channel:join',
  LEAVE_CHANNEL: 'channel:leave',
  JOIN_CONVERSATION: 'conversation:join',
  LEAVE_CONVERSATION: 'conversation:leave',
  MESSAGE_CREATED: 'message:created',
  MESSAGE_UPDATED: 'message:updated',
  MESSAGE_DELETED: 'message:deleted',
  REACTION_ADDED: 'reaction:added',
  REACTION_REMOVED: 'reaction:removed',
  TYPING_START: 'typing:start',
  TYPING_STOP: 'typing:stop',
  PRESENCE_UPDATE: 'presence:update',
  UNREAD_UPDATE: 'unread:update',
  NOTIFICATION_CREATED: 'notification:created',
  ERROR: 'error',
} as const;

/** Login from prisma seed for local development */
export const DEMO_CREDENTIALS = {
  email: 'demo@pulse.app',
  password: 'Demo123!',
} as const;
