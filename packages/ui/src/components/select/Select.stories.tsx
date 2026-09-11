import type { Meta, StoryObj } from '@storybook/react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './Select';

const meta = {
  title: 'Components/Select',
  component: Select,
  tags: ['autodocs'],
} satisfies Meta<typeof Select>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Select defaultValue="recommended">
      <SelectTrigger className="w-64">
        <SelectValue placeholder="Sort by" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="recommended">Recommended</SelectItem>
        <SelectItem value="price-asc">Price: low to high</SelectItem>
        <SelectItem value="price-desc">Price: high to low</SelectItem>
      </SelectContent>
    </Select>
  ),
};

export const Error: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-64" hasError>
        <SelectValue placeholder="Select property type" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="studio">Studio</SelectItem>
        <SelectItem value="share-house">Share-house</SelectItem>
      </SelectContent>
    </Select>
  ),
};

export const Disabled: Story = {
  render: () => (
    <Select disabled defaultValue="recommended">
      <SelectTrigger className="w-64">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="recommended">Recommended</SelectItem>
      </SelectContent>
    </Select>
  ),
};

export const Empty: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-64">
        <SelectValue placeholder="No options available" />
      </SelectTrigger>
      <SelectContent />
    </Select>
  ),
};
