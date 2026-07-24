import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '@/shared/ui/button';

const meta: Meta<typeof Button> = {
  title: 'Shared/Button',
  component: Button,
};
export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = { args: { children: 'Send message' } };
export const Secondary: Story = { args: { children: 'Cancel', variant: 'secondary' } };
export const Destructive: Story = { args: { children: 'Delete', variant: 'destructive' } };
