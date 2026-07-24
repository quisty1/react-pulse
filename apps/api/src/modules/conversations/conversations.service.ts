import type { ConversationDto } from '@pulse/shared';
import { badRequest, forbidden, notFound } from '../../lib/errors.js';
import { toUserDto } from '../../lib/mappers.js';
import { prisma } from '../../lib/prisma.js';
import { WorkspaceService } from '../workspaces/workspaces.service.js';

export class ConversationService {
  private workspaces = new WorkspaceService();

  async list(userId: string, workspaceId: string): Promise<ConversationDto[]> {
    await this.workspaces.requireMembership(userId, workspaceId);
    const conversations = await prisma.conversation.findMany({
      where: {
        workspaceId,
        members: { some: { userId } },
      },
      include: {
        members: { include: { user: true } },
      },
      orderBy: [{ lastMessageAt: 'desc' }, { createdAt: 'desc' }],
    });

    return Promise.all(
      conversations.map(async (c) => {
        const membership = c.members.find((m) => m.userId === userId);
        let unreadCount = 0;
        if (membership) {
          unreadCount = await prisma.message.count({
            where: {
              conversationId: c.id,
              parentId: null,
              authorId: { not: userId },
              ...(membership.lastReadMessageId ? { id: { gt: membership.lastReadMessageId } } : {}),
            },
          });
        }
        return {
          id: c.id,
          workspaceId: c.workspaceId,
          type: c.type,
          name: c.name,
          members: c.members.map((m) => toUserDto(m.user)),
          lastMessageAt: c.lastMessageAt?.toISOString() ?? null,
          unreadCount,
        };
      }),
    );
  }

  async create(userId: string, workspaceId: string, input: { memberIds: string[]; name?: string }) {
    await this.workspaces.requireMembership(userId, workspaceId);
    const uniqueIds = [...new Set([userId, ...input.memberIds])];
    if (uniqueIds.length < 2) throw badRequest('At least one other member is required');

    for (const id of uniqueIds) {
      await this.workspaces.requireMembership(id, workspaceId);
    }

    if (uniqueIds.length === 2) {
      const [a, b] = uniqueIds;
      const existing = await prisma.conversation.findFirst({
        where: {
          workspaceId,
          type: 'DIRECT',
          AND: [{ members: { some: { userId: a } } }, { members: { some: { userId: b } } }],
        },
        include: { members: { include: { user: true } } },
      });
      if (existing && existing.members.length === 2) {
        return {
          id: existing.id,
          workspaceId: existing.workspaceId,
          type: existing.type,
          name: existing.name,
          members: existing.members.map((m) => toUserDto(m.user)),
          lastMessageAt: existing.lastMessageAt?.toISOString() ?? null,
          unreadCount: 0,
        };
      }
    }

    const conversation = await prisma.conversation.create({
      data: {
        workspaceId,
        type: uniqueIds.length === 2 ? 'DIRECT' : 'GROUP',
        name: uniqueIds.length > 2 ? (input.name ?? 'Group chat') : null,
        createdById: userId,
        members: {
          create: uniqueIds.map((id) => ({ userId: id })),
        },
      },
      include: { members: { include: { user: true } } },
    });

    return {
      id: conversation.id,
      workspaceId: conversation.workspaceId,
      type: conversation.type,
      name: conversation.name,
      members: conversation.members.map((m) => toUserDto(m.user)),
      lastMessageAt: null,
      unreadCount: 0,
    };
  }

  async markRead(userId: string, conversationId: string, messageId: string) {
    const member = await prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!member) throw forbidden('Not a conversation member');
    await prisma.conversationMember.update({
      where: { id: member.id },
      data: { lastReadMessageId: messageId },
    });
    return { ok: true };
  }

  async get(userId: string, conversationId: string) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { members: { include: { user: true } } },
    });
    if (!conversation) throw notFound('Conversation not found');
    if (!conversation.members.some((m) => m.userId === userId)) {
      throw forbidden('Not a conversation member');
    }
    return {
      id: conversation.id,
      workspaceId: conversation.workspaceId,
      type: conversation.type,
      name: conversation.name,
      members: conversation.members.map((m) => toUserDto(m.user)),
      lastMessageAt: conversation.lastMessageAt?.toISOString() ?? null,
    };
  }
}
