import type { ChannelDto } from '@pulse/shared';
import { conflict, forbidden, notFound } from '../../lib/errors.js';
import { prisma } from '../../lib/prisma.js';
import { WorkspaceService } from '../workspaces/workspaces.service.js';

export class ChannelService {
  private workspaces = new WorkspaceService();

  async list(userId: string, workspaceId: string): Promise<ChannelDto[]> {
    await this.workspaces.requireMembership(userId, workspaceId);
    const channels = await prisma.channel.findMany({
      where: {
        workspaceId,
        OR: [{ type: 'PUBLIC' }, { members: { some: { userId } } }],
      },
      include: {
        _count: { select: { members: true } },
        members: { where: { userId }, take: 1 },
      },
      orderBy: { name: 'asc' },
    });

    return Promise.all(
      channels.map(async (c) => {
        const membership = c.members[0];
        let unreadCount = 0;
        if (membership) {
          unreadCount = await prisma.message.count({
            where: {
              channelId: c.id,
              parentId: null,
              ...(membership.lastReadMessageId ? { id: { gt: membership.lastReadMessageId } } : {}),
              authorId: { not: userId },
            },
          });
        }
        return {
          id: c.id,
          workspaceId: c.workspaceId,
          name: c.name,
          type: c.type,
          topic: c.topic,
          description: c.description,
          createdById: c.createdById,
          createdAt: c.createdAt.toISOString(),
          memberCount: c._count.members,
          unreadCount,
        };
      }),
    );
  }

  async create(
    userId: string,
    workspaceId: string,
    input: { name: string; type?: 'PUBLIC' | 'PRIVATE'; topic?: string; description?: string },
  ) {
    await this.workspaces.requireRole(userId, workspaceId, ['OWNER', 'ADMIN', 'MEMBER']);
    const existing = await prisma.channel.findUnique({
      where: { workspaceId_name: { workspaceId, name: input.name } },
    });
    if (existing) throw conflict('Channel name already exists');

    const channel = await prisma.channel.create({
      data: {
        workspaceId,
        name: input.name,
        type: input.type ?? 'PUBLIC',
        topic: input.topic,
        description: input.description,
        createdById: userId,
        members: { create: { userId } },
      },
    });

    if (channel.type === 'PUBLIC') {
      const members = await prisma.workspaceMember.findMany({
        where: { workspaceId, userId: { not: userId } },
        select: { userId: true },
      });
      if (members.length) {
        await prisma.channelMember.createMany({
          data: members.map((m) => ({ channelId: channel.id, userId: m.userId })),
          skipDuplicates: true,
        });
      }
    }

    return this.get(userId, channel.id);
  }

  async get(userId: string, channelId: string) {
    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
      include: { _count: { select: { members: true } } },
    });
    if (!channel) throw notFound('Channel not found');
    await this.requireChannelAccess(userId, channel);

    return {
      id: channel.id,
      workspaceId: channel.workspaceId,
      name: channel.name,
      type: channel.type,
      topic: channel.topic,
      description: channel.description,
      createdById: channel.createdById,
      createdAt: channel.createdAt.toISOString(),
      memberCount: channel._count.members,
    };
  }

  async update(
    userId: string,
    channelId: string,
    input: { name?: string; topic?: string | null; description?: string | null },
  ) {
    const channel = await prisma.channel.findUnique({ where: { id: channelId } });
    if (!channel) throw notFound('Channel not found');
    await this.workspaces.requireRole(userId, channel.workspaceId, ['OWNER', 'ADMIN']);

    const updated = await prisma.channel.update({
      where: { id: channelId },
      data: {
        name: input.name,
        topic: input.topic,
        description: input.description,
      },
    });
    return this.get(userId, updated.id);
  }

  async join(userId: string, channelId: string) {
    const channel = await prisma.channel.findUnique({ where: { id: channelId } });
    if (!channel) throw notFound('Channel not found');
    await this.workspaces.requireMembership(userId, channel.workspaceId);
    if (channel.type === 'PRIVATE') throw forbidden('Cannot join private channel without invite');

    await prisma.channelMember.upsert({
      where: { channelId_userId: { channelId, userId } },
      create: { channelId, userId },
      update: {},
    });
    return this.get(userId, channelId);
  }

  async leave(userId: string, channelId: string) {
    const channel = await prisma.channel.findUnique({ where: { id: channelId } });
    if (!channel) throw notFound('Channel not found');
    if (channel.name === 'general') throw forbidden('Cannot leave #general');

    await prisma.channelMember.deleteMany({ where: { channelId, userId } });
    return { ok: true };
  }

  async remove(userId: string, channelId: string) {
    const channel = await prisma.channel.findUnique({ where: { id: channelId } });
    if (!channel) throw notFound('Channel not found');
    if (channel.name === 'general') throw forbidden('Cannot delete #general');
    await this.workspaces.requireRole(userId, channel.workspaceId, ['OWNER', 'ADMIN']);
    await prisma.channel.delete({ where: { id: channelId } });
    return { ok: true };
  }

  async listMembers(userId: string, channelId: string) {
    const channel = await prisma.channel.findUnique({ where: { id: channelId } });
    if (!channel) throw notFound('Channel not found');
    await this.requireChannelAccess(userId, channel);
    const members = await prisma.channelMember.findMany({
      where: { channelId },
      include: { user: true },
    });
    return members.map((m) => ({
      id: m.id,
      joinedAt: m.joinedAt.toISOString(),
      user: {
        id: m.user.id,
        email: m.user.email,
        displayName: m.user.displayName,
        avatarUrl: m.user.avatarUrl,
        statusMessage: m.user.statusMessage,
        createdAt: m.user.createdAt.toISOString(),
      },
    }));
  }

  async markRead(userId: string, channelId: string, messageId: string) {
    await prisma.channelMember.updateMany({
      where: { channelId, userId },
      data: { lastReadMessageId: messageId },
    });
    return { ok: true };
  }

  async requireChannelAccess(
    userId: string,
    channel: { id: string; type: string; workspaceId: string },
  ) {
    await this.workspaces.requireMembership(userId, channel.workspaceId);
    if (channel.type === 'PRIVATE') {
      const member = await prisma.channelMember.findUnique({
        where: { channelId_userId: { channelId: channel.id, userId } },
      });
      if (!member) throw forbidden('Not a channel member');
    }
  }
}
