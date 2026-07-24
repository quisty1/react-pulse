import type { Meta, StoryObj } from '@storybook/react';
import { MessageItem } from '@/entities/message/ui/message-item';
import type { MessageDto } from '@pulse/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const message: MessageDto = {
  id: 'm1',
  channelId: 'c1',
  conversationId: null,
  parentId: null,
  author: {
    id: 'u1',
    email: 'alex@pulse.app',
    displayName: 'Alex Rivera',
    avatarUrl: null,
    statusMessage: null,
    createdAt: new Date().toISOString(),
  },
  body: 'Welcome to **Pulse** with safe markdown.',
  clientId: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  editedAt: null,
  replyCount: 2,
  reactions: [{ emoji: '🎉', count: 3, me: true, userIds: ['u1'] }],
  attachments: [],
  mentionedUserIds: [],
};

const meta: Meta<typeof MessageItem> = {
  title: 'Entities/MessageItem',
  component: MessageItem,
  decorators: [
    (Story) => (
      <QueryClientProvider client={new QueryClient()}>
        <div className="max-w-xl bg-background p-4">
          <Story />
        </div>
      </QueryClientProvider>
    ),
  ],
};
export default meta;

export const Default: StoryObj<typeof MessageItem> = {
  args: { message },
};

export const LongContent: StoryObj<typeof MessageItem> = {
  args: {
    message: {
      ...message,
      body: 'Long content\n\n'.repeat(20) + 'End of message.',
    },
  },
};
