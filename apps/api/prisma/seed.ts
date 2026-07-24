// Демо-данные для локальной разработки (идемпотентно: сначала чистим таблицы)
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';
import argon2 from 'argon2';
import { PrismaClient } from '@prisma/client';
import { DEMO_CREDENTIALS } from '@pulse/shared';

const here = dirname(fileURLToPath(import.meta.url));
// Ищем .env в cwd и вверх по монорепо
const envCandidates = [
  resolve(process.cwd(), '.env'),
  resolve(here, '../../../.env'),
  resolve(here, '../../.env'),
];
for (const envPath of envCandidates) {
  if (existsSync(envPath)) {
    config({ path: envPath });
    break;
  }
}

const prisma = new PrismaClient();

async function main() {
  // Порядок удаления с учётом FK
  await prisma.reaction.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.message.deleteMany();
  await prisma.channelMember.deleteMany();
  await prisma.conversationMember.deleteMany();
  await prisma.channel.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.invite.deleteMany();
  await prisma.workspaceMember.deleteMany();
  await prisma.workspace.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await argon2.hash(DEMO_CREDENTIALS.password);

  const demo = await prisma.user.create({
    data: {
      email: DEMO_CREDENTIALS.email,
      passwordHash,
      displayName: 'Demo User',
      statusMessage: 'Exploring Pulse',
    },
  });

  const alex = await prisma.user.create({
    data: {
      email: 'alex@pulse.app',
      passwordHash,
      displayName: 'Alex Rivera',
      statusMessage: 'Shipping features',
    },
  });

  const jordan = await prisma.user.create({
    data: {
      email: 'jordan@pulse.app',
      passwordHash,
      displayName: 'Jordan Lee',
      statusMessage: 'Design reviews',
    },
  });

  const sam = await prisma.user.create({
    data: {
      email: 'sam@pulse.app',
      passwordHash,
      displayName: 'Sam Chen',
      statusMessage: 'On call',
    },
  });

  // Два воркспейса: Acme (основной демо) и Northstar
  const acme = await prisma.workspace.create({
    data: {
      name: 'Acme Labs',
      slug: 'acme-labs',
      members: {
        create: [
          { userId: demo.id, role: 'OWNER' },
          { userId: alex.id, role: 'ADMIN' },
          { userId: jordan.id, role: 'MEMBER' },
          { userId: sam.id, role: 'MEMBER' },
        ],
      },
    },
  });

  const northstar = await prisma.workspace.create({
    data: {
      name: 'Northstar',
      slug: 'northstar',
      members: {
        create: [
          { userId: demo.id, role: 'MEMBER' },
          { userId: alex.id, role: 'OWNER' },
          { userId: jordan.id, role: 'ADMIN' },
        ],
      },
    },
  });

  // Каналы: public general/engineering и private leadership
  const general = await prisma.channel.create({
    data: {
      workspaceId: acme.id,
      name: 'general',
      type: 'PUBLIC',
      topic: 'Day-to-day collaboration',
      description: 'Default public channel for Acme Labs',
      createdById: demo.id,
      members: {
        create: [
          { userId: demo.id },
          { userId: alex.id },
          { userId: jordan.id },
          { userId: sam.id },
        ],
      },
    },
  });

  const engineering = await prisma.channel.create({
    data: {
      workspaceId: acme.id,
      name: 'engineering',
      type: 'PUBLIC',
      topic: 'Build logs and architecture',
      createdById: alex.id,
      members: {
        create: [{ userId: demo.id }, { userId: alex.id }, { userId: sam.id }],
      },
    },
  });

  const leadership = await prisma.channel.create({
    data: {
      workspaceId: acme.id,
      name: 'leadership',
      type: 'PRIVATE',
      topic: 'Private leadership sync',
      createdById: demo.id,
      members: {
        create: [{ userId: demo.id }, { userId: alex.id }],
      },
    },
  });

  await prisma.channel.create({
    data: {
      workspaceId: northstar.id,
      name: 'general',
      type: 'PUBLIC',
      topic: 'Northstar HQ',
      createdById: alex.id,
      members: {
        create: [{ userId: demo.id }, { userId: alex.id }, { userId: jordan.id }],
      },
    },
  });

  // Приветственное сообщение с упоминанием и тредом
  const parent = await prisma.message.create({
    data: {
      channelId: general.id,
      authorId: alex.id,
      body: 'Welcome to **Pulse** — our team HQ. Try mentions like @Demo and reactions.',
      mentionedIds: [demo.id],
    },
  });

  await prisma.message.create({
    data: {
      channelId: general.id,
      authorId: demo.id,
      parentId: parent.id,
      body: 'Thanks Alex! Looking forward to shipping together.',
    },
  });

  await prisma.message.create({
    data: {
      channelId: engineering.id,
      authorId: sam.id,
      body: 'API health checks are green. Socket rooms ready for demo.',
    },
  });

  await prisma.message.create({
    data: {
      channelId: leadership.id,
      authorId: demo.id,
      body: 'Private channel for roadmap decisions.',
    },
  });

  await prisma.reaction.create({
    data: { messageId: parent.id, userId: jordan.id, emoji: '🎉' },
  });
  await prisma.reaction.create({
    data: { messageId: parent.id, userId: demo.id, emoji: '👍' },
  });

  await prisma.notification.create({
    data: {
      userId: demo.id,
      type: 'MENTION',
      title: 'You were mentioned',
      body: 'Welcome to **Pulse** — our team HQ.',
      workspaceId: acme.id,
      channelId: general.id,
      messageId: parent.id,
    },
  });

  // DM и групповой чат для демо UI
  const dm = await prisma.conversation.create({
    data: {
      workspaceId: acme.id,
      type: 'DIRECT',
      createdById: demo.id,
      lastMessageAt: new Date(),
      members: {
        create: [{ userId: demo.id }, { userId: jordan.id }],
      },
    },
  });

  await prisma.message.create({
    data: {
      conversationId: dm.id,
      authorId: jordan.id,
      body: 'Hey! Ready for the Pulse walkthrough?',
    },
  });

  const group = await prisma.conversation.create({
    data: {
      workspaceId: acme.id,
      type: 'GROUP',
      name: 'Launch crew',
      createdById: demo.id,
      lastMessageAt: new Date(),
      members: {
        create: [{ userId: demo.id }, { userId: alex.id }, { userId: sam.id }],
      },
    },
  });

  await prisma.message.create({
    data: {
      conversationId: group.id,
      authorId: alex.id,
      body: 'Group DM for launch checklist.',
    },
  });

  console.log('Seed completed');
  console.log(`Demo login: ${DEMO_CREDENTIALS.email} / ${DEMO_CREDENTIALS.password}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
