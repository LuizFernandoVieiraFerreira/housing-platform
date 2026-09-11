import type { Meta, StoryObj } from '@storybook/react';

import { FormField } from './FormField';
import { Input } from '../input/Input';

const meta = {
  title: 'Components/FormField',
  component: FormField,
  tags: ['autodocs'],
  args: {
    label: 'Email',
    htmlFor: 'email',
    children: <Input id="email" type="email" placeholder="you@example.com" />,
  },
} satisfies Meta<typeof FormField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Required: Story = {
  args: {
    required: true,
  },
};

export const Error: Story = {
  args: {
    error: 'Enter a valid email address.',
    children: <Input id="email" type="email" hasError defaultValue="not-an-email" />,
  },
};

export const Disabled: Story = {
  args: {
    children: <Input id="email" type="email" disabled placeholder="Disabled field" />,
  },
};
