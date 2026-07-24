import type { Meta, StoryObj } from '@storybook/react';
import { Avatar, AvatarFallback } from '@/shared/ui/avatar';

const meta: Meta<typeof Avatar> = {
  title: 'Shared/Avatar',
  component: Avatar,
};
export default meta;
type Story = StoryObj<typeof Avatar>;

export const Fallback: Story = {
  render: () => (
    <Avatar>
      <AvatarFallback>PU</AvatarFallback>
    </Avatar>
  ),
};
