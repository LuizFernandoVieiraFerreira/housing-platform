import type { Meta, StoryObj } from '@storybook/react';

import { Input } from './Input';

const meta = {
  title: 'Components/Input',
  component: Input,
  tags: ['autodocs'],
  args: {
    placeholder: 'Search locations',
  },
} satisfies Meta<typeof Input>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithValue: Story = {
  args: {
    defaultValue: 'Gangnam, Seoul',
  },
};

export const Error: Story = {
  args: {
    hasError: true,
    defaultValue: 'Invalid input',
    'aria-describedby': 'input-error',
  },
  render: (args) => (
    <div className="w-80 space-y-1">
      <Input {...args} />
      <p id="input-error" className="text-sm text-red-600">
        Please enter a valid location.
      </p>
    </div>
  ),
};

export const Disabled: Story = {
  args: {
    disabled: true,
    placeholder: 'Disabled input',
  },
};

export const Responsive: Story = {
  render: () => (
    <div className="w-full max-w-sm px-4 sm:max-w-md">
      <Input placeholder="Responsive width input" />
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};
