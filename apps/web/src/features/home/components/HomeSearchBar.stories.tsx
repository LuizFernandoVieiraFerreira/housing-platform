import type { Meta, StoryObj } from '@storybook/react';

import { HomeSearchBar } from './HomeSearchBar';

const meta: Meta<typeof HomeSearchBar> = {
  title: 'Features/Home/HomeSearchBar',
  component: HomeSearchBar,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof HomeSearchBar>;

export const Default: Story = {};

export const OnDarkBackground: Story = {
  decorators: [
    (Story) => (
      <div className="bg-surface-base rounded-xl p-8">
        <Story />
      </div>
    ),
  ],
};
