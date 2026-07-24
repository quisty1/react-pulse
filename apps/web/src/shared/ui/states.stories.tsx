import type { Meta, StoryObj } from '@storybook/react';
import { EmptyState } from '@/shared/ui/empty-state';
import { ErrorState } from '@/shared/ui/error-state';
import { Skeleton } from '@/shared/ui/skeleton';

const meta: Meta = { title: 'Shared/States' };
export default meta;

export const Empty: StoryObj = {
  render: () => <EmptyState title="No messages" description="Start the conversation." />,
};

export const Error: StoryObj = {
  render: () => <ErrorState onRetry={() => undefined} />,
};

export const Loading: StoryObj = {
  render: () => (
    <div className="space-y-2 p-4">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-20 w-full" />
    </div>
  ),
};
