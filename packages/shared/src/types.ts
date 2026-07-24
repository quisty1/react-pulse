import type {
  ChannelType,
  ConversationType,
  NotificationType,
  WorkspaceRole,
} from './constants.js';

/** Публичные DTO, общие для API и web (даты — ISO-строки) */

export interface UserDto {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  statusMessage: string | null;
  createdAt: string;
}

export interface AuthTokensDto {
  accessToken: string;
  user: UserDto;
}

export interface WorkspaceDto {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  createdAt: string;
  role?: WorkspaceRole;
}

export interface WorkspaceMemberDto {
  id: string;
  role: WorkspaceRole;
  user: UserDto;
  joinedAt: string;
}

export interface ChannelDto {
  id: string;
  workspaceId: string;
  name: string;
  type: ChannelType;
  topic: string | null;
  description: string | null;
  createdById: string;
  createdAt: string;
  memberCount?: number;
  unreadCount?: number;
}

export interface ConversationDto {
  id: string;
  workspaceId: string;
  type: ConversationType;
  name: string | null;
  members: UserDto[];
  lastMessageAt: string | null;
  unreadCount?: number;
}

export interface AttachmentDto {
  id: string;
  fileName: string;
  mimeType: string;
  size: number;
  url: string;
}

export interface ReactionDto {
  emoji: string;
  count: number;
  me: boolean;
  userIds: string[];
}

export interface MessageDto {
  id: string;
  channelId: string | null;
  conversationId: string | null;
  parentId: string | null;
  author: UserDto;
  body: string;
  // Для идемпотентности оптимистичных отправок
  clientId: string | null;
  createdAt: string;
  updatedAt: string;
  editedAt: string | null;
  replyCount: number;
  reactions: ReactionDto[];
  attachments: AttachmentDto[];
  mentionedUserIds: string[];
}

export interface NotificationDto {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  workspaceId: string | null;
  channelId: string | null;
  conversationId: string | null;
  messageId: string | null;
  createdAt: string;
}

export interface InviteDto {
  id: string;
  token: string;
  email: string | null;
  role: WorkspaceRole;
  expiresAt: string;
  inviteUrl: string;
}
