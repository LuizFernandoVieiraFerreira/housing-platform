import type { Meta, StoryObj } from '@storybook/react';

import { Button } from './Button';

const meta = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  args: {
    children: 'Search stays',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
  },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = {};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
  },
};

export const Ghost: Story = {
  args: {
    variant: 'ghost',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
  },
};

export const Small: Story = {
  args: {
    size: 'sm',
  },
};

export const Loading: Story = {
  args: {
    loading: true,
    children: 'Searching...',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const Responsive: Story = {
  render: () => (
    <div className="flex w-full max-w-md flex-col gap-3 sm:flex-row">
      <Button className="w-full sm:w-auto">Full width mobile</Button>
      <Button variant="secondary" className="w-full sm:w-auto">
        Secondary
      </Button>
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};
