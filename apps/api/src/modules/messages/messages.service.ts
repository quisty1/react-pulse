import type { Message, Reaction, User, Attachment } from '@prisma/client';
import type { MessageDto, ReactionDto } from '@pulse/shared';
import { forbidden, notFound } from '../../lib/errors.js';
import { toUserDto } from '../../lib/mappers.js';
import { prisma } from '../../lib/prisma.js';
import { ChannelService } from '../channels/channels.service.js';
import { WorkspaceService } from '../workspaces/workspaces.service.js';

type MessageWithRelations = Message & {
  author: User;
  reactions: (Reaction & { userId: string })[];
  attachments: Attachment[];
  _count: { replies: number };
};

function groupReactions(reactions: Reaction[], currentUserId: string): ReactionDto[] {
  const map = new Map<string, ReactionDto>();
  for (const r of reactions) {
    const existing = map.get(r.emoji);
    if (existing) {
      existing.count += 1;
      existing.userIds.push(r.userId);
      if (r.userId === currentUserId) existing.me = true;
    } else {
      map.set(r.emoji, {
        emoji: r.emoji,
        count: 1,
        me: r.userId === currentUserId,
        userIds: [r.userId],
      });
    }
  }
  return [...map.values()];
}

export function toMessageDto(message: MessageWithRelations, currentUserId: string): MessageDto {
  return {
    id: message.id,
    channelId: message.channelId,
    conversationId: message.conversationId,
    parentId: message.parentId,
    author: toUserDto(message.author),
    body: message.body,
    clientId: message.clientId,
    createdAt: message.createdAt.toISOString(),
    updatedAt: message.updatedAt.toISOString(),
    editedAt: message.editedAt?.toISOString() ?? null,
    replyCount: message._count.replies,
    reactions: groupReactions(message.reactions, currentUserId),
    attachments: message.attachments.map((a) => ({
      id: a.id,
      fileName: a.fileName,
      mimeType: a.mimeType,
      size: a.size,
      url: `/api/files/${a.id}`,
    })),
    mentionedUserIds: message.mentionedIds,
  };
}

const messageInclude = {
  author: true,
  reactions: true,
  attachments: true,
  _count: { select: { replies: true } },
} as const;

export class MessageService {
  private channels = new ChannelService();
  private workspaces = new WorkspaceService();

  async listChannelMessages(
    userId: string,
    channelId: string,
    opts: { cursor?: string; limit: number; parentId?: string | null },
  ) {
    const channel = await prisma.channel.findUnique({ where: { id: channelId } });
    if (!channel) throw notFound('Channel not found');
    await this.channels.requireChannelAccess(userId, channel);

    const messages = await prisma.message.findMany({
      where: {
        channelId,
        parentId: opts.parentId === undefined ? null : opts.parentId,
      },
      include: messageInclude,
      orderBy: { createdAt: 'desc' },
      take: opts.limit + 1,
      ...(opts.cursor ? { cursor: { id: opts.cursor }, skip: 1 } : {}),
    });

    const hasMore = messages.length > opts.limit;
    const items = hasMore ? messages.slice(0, opts.limit) : messages;
    return {
      items: items.reverse().map((m) => toMessageDto(m, userId)),
      meta: {
        nextCursor: hasMore ? (items[0]?.id ?? null) : null,
        hasMore,
      },
    };
  }

  async listConversationMessages(
    userId: string,
    conversationId: string,
    opts: { cursor?: string; limit: number; parentId?: string | null },
  ) {
    await this.requireConversationAccess(userId, conversationId);
    const messages = await prisma.message.findMany({
      where: {
        conversationId,
        parentId: opts.parentId === undefined ? null : opts.parentId,
      },
      include: messageInclude,
      orderBy: { createdAt: 'desc' },
      take: opts.limit + 1,
      ...(opts.cursor ? { cursor: { id: opts.cursor }, skip: 1 } : {}),
    });

    const hasMore = messages.length > opts.limit;
    const items = hasMore ? messages.slice(0, opts.limit) : messages;
    return {
      items: items.reverse().map((m) => toMessageDto(m, userId)),
      meta: {
        nextCursor: hasMore ? (items[0]?.id ?? null) : null,
        hasMore,
      },
    };
  }

  async createInChannel(
    userId: string,
    channelId: string,
    input: {
      body: string;
      parentId?: string;
      clientId?: string;
      mentionedUserIds?: string[];
      attachmentIds?: string[];
    },
  ) {
    const channel = await prisma.channel.findUnique({ where: { id: channelId } });
    if (!channel) throw notFound('Channel not found');
    await this.channels.requireChannelAccess(userId, channel);

    const membership = await prisma.channelMember.findUnique({
      where: { channelId_userId: { channelId, userId } },
    });
    if (!membership) {
      await prisma.channelMember.create({ data: { channelId, userId } });
    }

    if (input.parentId) {
      const parent = await prisma.message.findFirst({
        where: { id: input.parentId, channelId },
      });
      if (!parent) throw notFound('Parent message not found');
    }

    const message = await prisma.message.create({
      data: {
        channelId,
        authorId: userId,
        body: input.body,
        parentId: input.parentId,
        clientId: input.clientId,
        mentionedIds: input.mentionedUserIds ?? [],
        attachments: input.attachmentIds?.length
          ? { connect: input.attachmentIds.map((id) => ({ id })) }
          : undefined,
      },
      include: messageInclude,
    });

    if (input.attachmentIds?.length) {
      await prisma.attachment.updateMany({
        where: { id: { in: input.attachmentIds }, uploaderId: userId },
        data: { messageId: message.id },
      });
    }

    await this.createMentionNotifications(userId, message, channel.workspaceId, channelId, null);

    return toMessageDto(message, userId);
  }

  async createInConversation(
    userId: string,
    conversationId: string,
    input: {
      body: string;
      parentId?: string;
      clientId?: string;
      mentionedUserIds?: string[];
      attachmentIds?: string[];
    },
  ) {
    const conversation = await this.requireConversationAccess(userId, conversationId);

    if (input.parentId) {
      const parent = await prisma.message.findFirst({
        where: { id: input.parentId, conversationId },
      });
      if (!parent) throw notFound('Parent message not found');
    }

    const message = await prisma.message.create({
      data: {
        conversationId,
        authorId: userId,
        body: input.body,
        parentId: input.parentId,
        clientId: input.clientId,
        mentionedIds: input.mentionedUserIds ?? [],
        attachments: input.attachmentIds?.length
          ? { connect: input.attachmentIds.map((id) => ({ id })) }
          : undefined,
      },
      include: messageInclude,
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: message.createdAt },
    });

    if (input.attachmentIds?.length) {
      await prisma.attachment.updateMany({
        where: { id: { in: input.attachmentIds }, uploaderId: userId },
        data: { messageId: message.id },
      });
    }

    await this.createMentionNotifications(
      userId,
      message,
      conversation.workspaceId,
      null,
      conversationId,
    );

    return toMessageDto(message, userId);
  }

  async update(userId: string, messageId: string, body: string) {
    const message = await prisma.message.findUnique({ where: { id: messageId } });
    if (!message) throw notFound('Message not found');
    if (message.authorId !== userId) throw forbidden('Can only edit own messages');

    const updated = await prisma.message.update({
      where: { id: messageId },
      data: { body, editedAt: new Date() },
      include: messageInclude,
    });
    return toMessageDto(updated, userId);
  }

  async remove(userId: string, messageId: string) {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: { channel: true },
    });
    if (!message) throw notFound('Message not found');

    if (message.authorId !== userId) {
      if (message.channelId && message.channel) {
        await this.workspaces.requireRole(userId, message.channel.workspaceId, ['OWNER', 'ADMIN']);
      } else {
        throw forbidden('Can only delete own messages');
      }
    }

    await prisma.message.delete({ where: { id: messageId } });
    return {
      id: messageId,
      channelId: message.channelId,
      conversationId: message.conversationId,
      parentId: message.parentId,
    };
  }

  async toggleReaction(userId: string, messageId: string, emoji: string) {
    const message = await prisma.message.findUnique({ where: { id: messageId } });
    if (!message) throw notFound('Message not found');

    if (message.channelId) {
      const channel = await prisma.channel.findUniqueOrThrow({ where: { id: message.channelId } });
      await this.channels.requireChannelAccess(userId, channel);
    } else if (message.conversationId) {
      await this.requireConversationAccess(userId, message.conversationId);
    }

    const existing = await prisma.reaction.findUnique({
      where: {
        messageId_userId_emoji: { messageId, userId, emoji },
      },
    });

    if (existing) {
      await prisma.reaction.delete({ where: { id: existing.id } });
      return { messageId, emoji, added: false, userId };
    }

    await prisma.reaction.create({ data: { messageId, userId, emoji } });
    return { messageId, emoji, added: true, userId };
  }

  async getById(userId: string, messageId: string) {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: messageInclude,
    });
    if (!message) throw notFound('Message not found');

    if (message.channelId) {
      const channel = await prisma.channel.findUniqueOrThrow({ where: { id: message.channelId } });
      await this.channels.requireChannelAccess(userId, channel);
    } else if (message.conversationId) {
      await this.requireConversationAccess(userId, message.conversationId);
    }

    return toMessageDto(message, userId);
  }

  private async requireConversationAccess(userId: string, conversationId: string) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { members: true },
    });
    if (!conversation) throw notFound('Conversation not found');
    if (!conversation.members.some((m) => m.userId === userId)) {
      throw forbidden('Not a conversation member');
    }
    return conversation;
  }

  private async createMentionNotifications(
    authorId: string,
    message: Message,
    workspaceId: string,
    channelId: string | null,
    conversationId: string | null,
  ) {
    const ids = message.mentionedIds.filter((id) => id !== authorId);
    if (!ids.length) return;

    await prisma.notification.createMany({
      data: ids.map((userId) => ({
        userId,
        type: 'MENTION' as const,
        title: 'You were mentioned',
        body: message.body.slice(0, 120),
        workspaceId,
        channelId,
        conversationId,
        messageId: message.id,
      })),
    });
  }
}
