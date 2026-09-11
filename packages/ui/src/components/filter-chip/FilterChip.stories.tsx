import type { Meta, StoryObj } from '@storybook/react';

import { FilterChip } from './FilterChip';

const meta = {
  title: 'Components/FilterChip',
  component: FilterChip,
  tags: ['autodocs'],
  args: {
    children: 'Studio',
  },
} satisfies Meta<typeof FilterChip>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Inactive: Story = {
  args: {
    active: false,
  },
};

export const Active: Story = {
  args: {
    active: true,
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const FilterBar: Story = {
  render: () => (
    <div className="flex gap-2 overflow-x-auto">
      <FilterChip active>All types</FilterChip>
      <FilterChip>Share-house</FilterChip>
      <FilterChip active>Studio</FilterChip>
      <FilterChip>Micro Studio</FilterChip>
      <FilterChip>Multi-bedroom</FilterChip>
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};
