import type { Meta, StoryObj } from '@storybook/react';
import { ChannelList } from '@/widgets/channel-list';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

const meta: Meta = {
  title: 'Widgets/ChannelList',
  decorators: [
    (Story) => (
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter initialEntries={['/app/ws1']}>
          <Routes>
            <Route
              path="/app/:workspaceId"
              element={
                <div className="h-[480px] w-72 bg-sidebar">
                  <Story />
                </div>
              }
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    ),
  ],
};
export default meta;

export const Default: StoryObj = {
  render: () => <ChannelList />,
};
