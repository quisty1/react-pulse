import type { Meta, StoryObj } from '@storybook/react';
import { Input } from '@/shared/ui/input';

const meta: Meta<typeof Input> = {
  title: 'Shared/Input',
  component: Input,
};
export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = { args: { placeholder: 'Message #general' } };
export const Disabled: Story = { args: { placeholder: 'Disabled', disabled: true } };
