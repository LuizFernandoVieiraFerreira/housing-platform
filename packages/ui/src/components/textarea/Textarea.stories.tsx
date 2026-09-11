import type { Meta, StoryObj } from '@storybook/react';

import { Textarea } from './Textarea';

const meta = {
  title: 'Components/Textarea',
  component: Textarea,
  tags: ['autodocs'],
  args: {
    placeholder: 'Describe your housing needs...',
  },
} satisfies Meta<typeof Textarea>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Error: Story = {
  args: {
    hasError: true,
    defaultValue: 'Too short',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};
