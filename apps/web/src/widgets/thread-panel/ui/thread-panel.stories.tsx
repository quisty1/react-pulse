import type { Meta, StoryObj } from '@storybook/react';
import { ThreadPanel } from '@/widgets/thread-panel';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const meta: Meta<typeof ThreadPanel> = {
  title: 'Widgets/ThreadPanel',
  component: ThreadPanel,
  decorators: [
    (Story) => (
      <QueryClientProvider client={new QueryClient()}>
        <div className="h-[560px] w-[360px] border">
          <Story />
        </div>
      </QueryClientProvider>
    ),
  ],
};
export default meta;

export const Default: StoryObj<typeof ThreadPanel> = {
  args: { parentId: 'parent1', channelId: 'c1' },
};
