import type { Meta, StoryObj } from '@storybook/react';
import { MessageComposer } from '@/features/send-message';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const meta: Meta<typeof MessageComposer> = {
  title: 'Features/MessageComposer',
  component: MessageComposer,
  decorators: [
    (Story) => (
      <QueryClientProvider client={new QueryClient()}>
        <div className="max-w-xl border bg-background">
          <Story />
        </div>
      </QueryClientProvider>
    ),
  ],
};
export default meta;

export const Default: StoryObj<typeof MessageComposer> = {
  args: { targetName: '#general', channelId: 'c1' },
};
