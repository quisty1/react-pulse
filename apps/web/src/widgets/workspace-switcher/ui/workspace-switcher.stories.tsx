import type { Meta, StoryObj } from '@storybook/react';
import { WorkspaceSwitcher } from '@/widgets/workspace-switcher';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

const meta: Meta = {
  title: 'Widgets/WorkspaceSwitcher',
  decorators: [
    (Story) => (
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <div className="bg-sidebar p-4">
            <Story />
          </div>
        </MemoryRouter>
      </QueryClientProvider>
    ),
  ],
};
export default meta;

export const Default: StoryObj = {
  render: () => <WorkspaceSwitcher />,
};
