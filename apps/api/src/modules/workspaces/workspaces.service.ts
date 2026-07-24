import type { WorkspaceRole } from '@prisma/client';
import type { WorkspaceDto, WorkspaceMemberDto } from '@pulse/shared';
import { badRequest, conflict, forbidden, notFound } from '../../lib/errors.js';
import { toUserDto } from '../../lib/mappers.js';
import { prisma } from '../../lib/prisma.js';

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
}

export class WorkspaceService {
  async listForUser(userId: string): Promise<WorkspaceDto[]> {
    const memberships = await prisma.workspaceMember.findMany({
      where: { userId },
      include: { workspace: true },
      orderBy: { joinedAt: 'asc' },
    });
    return memberships.map((m) => ({
      id: m.workspace.id,
      name: m.workspace.name,
      slug: m.workspace.slug,
      imageUrl: m.workspace.imageUrl,
      createdAt: m.workspace.createdAt.toISOString(),
      role: m.role,
    }));
  }

  async create(userId: string, input: { name: string; slug?: string }) {
    const base = input.slug ?? slugify(input.name);
    let slug = base || `ws-${Date.now()}`;
    const existing = await prisma.workspace.findUnique({ where: { slug } });
    if (existing) slug = `${slug}-${Date.now().toString(36)}`;

    const workspace = await prisma.workspace.create({
      data: {
        name: input.name,
        slug,
        members: { create: { userId, role: 'OWNER' } },
        channels: {
          create: {
            name: 'general',
            type: 'PUBLIC',
            topic: 'Company-wide announcements and work-based matters',
            createdById: userId,
            members: { create: { userId } },
          },
        },
      },
    });

    return {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      imageUrl: workspace.imageUrl,
      createdAt: workspace.createdAt.toISOString(),
      role: 'OWNER' as const,
    };
  }

  async get(userId: string, workspaceId: string) {
    const membership = await this.requireMembership(userId, workspaceId);
    const ws = membership.workspace;
    return {
      id: ws.id,
      name: ws.name,
      slug: ws.slug,
      imageUrl: ws.imageUrl,
      createdAt: ws.createdAt.toISOString(),
      role: membership.role,
    };
  }

  async update(userId: string, workspaceId: string, input: { name?: string }) {
    await this.requireRole(userId, workspaceId, ['OWNER', 'ADMIN']);
    const ws = await prisma.workspace.update({
      where: { id: workspaceId },
      data: { name: input.name },
    });
    return this.get(userId, ws.id);
  }

  async listMembers(userId: string, workspaceId: string): Promise<WorkspaceMemberDto[]> {
    await this.requireMembership(userId, workspaceId);
    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: { user: true },
      orderBy: { joinedAt: 'asc' },
    });
    return members.map((m) => ({
      id: m.id,
      role: m.role,
      user: toUserDto(m.user),
      joinedAt: m.joinedAt.toISOString(),
    }));
  }

  async createInvite(
    userId: string,
    workspaceId: string,
    input: { email?: string; role?: WorkspaceRole },
  ) {
    await this.requireRole(userId, workspaceId, ['OWNER', 'ADMIN']);
    const role = input.role ?? 'MEMBER';
    if (role === 'OWNER') throw badRequest('Cannot invite as OWNER');

    const invite = await prisma.invite.create({
      data: {
        workspaceId,
        email: input.email?.toLowerCase(),
        role,
        createdById: userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return {
      id: invite.id,
      token: invite.token,
      email: invite.email,
      role: invite.role,
      expiresAt: invite.expiresAt.toISOString(),
      inviteUrl: `/invite/${invite.token}`,
    };
  }

  async acceptInvite(userId: string, token: string) {
    const invite = await prisma.invite.findUnique({ where: { token } });
    if (!invite || invite.usedAt || invite.expiresAt < new Date()) {
      throw notFound('Invite is invalid or expired');
    }

    const existing = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: invite.workspaceId, userId } },
    });
    if (existing) throw conflict('Already a member');

    const publicChannels = await prisma.channel.findMany({
      where: { workspaceId: invite.workspaceId, type: 'PUBLIC' },
      select: { id: true },
    });

    await prisma.$transaction([
      prisma.workspaceMember.create({
        data: { workspaceId: invite.workspaceId, userId, role: invite.role },
      }),
      prisma.invite.update({ where: { id: invite.id }, data: { usedAt: new Date() } }),
      prisma.channelMember.createMany({
        data: publicChannels.map((c) => ({ channelId: c.id, userId })),
        skipDuplicates: true,
      }),
    ]);

    return this.get(userId, invite.workspaceId);
  }

  async updateMemberRole(
    actorId: string,
    workspaceId: string,
    memberId: string,
    role: 'ADMIN' | 'MEMBER',
  ) {
    await this.requireRole(actorId, workspaceId, ['OWNER']);
    const member = await prisma.workspaceMember.findFirst({
      where: { id: memberId, workspaceId },
    });
    if (!member) throw notFound('Member not found');
    if (member.role === 'OWNER') throw forbidden('Cannot change owner role');

    await prisma.workspaceMember.update({ where: { id: memberId }, data: { role } });
    return this.listMembers(actorId, workspaceId);
  }

  async removeMember(actorId: string, workspaceId: string, memberId: string) {
    const actor = await this.requireRole(actorId, workspaceId, ['OWNER', 'ADMIN']);
    const member = await prisma.workspaceMember.findFirst({
      where: { id: memberId, workspaceId },
      include: { user: true },
    });
    if (!member) throw notFound('Member not found');
    if (member.role === 'OWNER') throw forbidden('Cannot remove owner');
    if (actor.role === 'ADMIN' && member.role === 'ADMIN') {
      throw forbidden('Admins cannot remove other admins');
    }

    await prisma.workspaceMember.delete({ where: { id: memberId } });
    return { ok: true };
  }

  async leave(userId: string, workspaceId: string) {
    const membership = await this.requireMembership(userId, workspaceId);
    if (membership.role === 'OWNER') {
      throw forbidden('Owner must transfer ownership before leaving');
    }
    await prisma.workspaceMember.delete({ where: { id: membership.id } });
    return { ok: true };
  }

  async requireMembership(userId: string, workspaceId: string) {
    const membership = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
      include: { workspace: true },
    });
    if (!membership) throw forbidden('Not a workspace member');
    return membership;
  }

  async requireRole(userId: string, workspaceId: string, roles: WorkspaceRole[]) {
    const membership = await this.requireMembership(userId, workspaceId);
    if (!roles.includes(membership.role)) {
      throw forbidden('Insufficient workspace permissions');
    }
    return membership;
  }
}
