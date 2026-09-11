import type { Meta, StoryObj } from '@storybook/react';
import type { ReactNode } from 'react';

import { PropertyCard } from './PropertyCard';

const meta = {
  title: 'Components/PropertyCard',
  component: PropertyCard,
  tags: ['autodocs'],
  args: {
    title: 'Sunny studio near Hongdae',
    propertyType: 'studio',
    district: 'Mapo-gu',
    nearestStationName: 'Hongik Univ.',
    monthlyPriceMin: 850000,
    tags: ['Furnished', 'Utilities included', 'No deposit'],
  },
} satisfies Meta<typeof PropertyCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithImage: Story = {
  args: {
    coverImageUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
    coverImageAlt: 'Bright studio apartment living room',
  },
};

export const NoTags: Story = {
  args: {
    tags: [],
  },
};

export const NoImage: Story = {
  args: {
    coverImageUrl: null,
  },
};

export const Compact: Story = {
  args: {
    variant: 'compact',
    tags: [],
  },
};

export const Horizontal: Story = {
  args: {
    variant: 'horizontal',
    tags: [],
  },
  render: (args) => (
    <div className="max-w-md divide-y rounded-xl border bg-white">
      <LinkLikeRow>
        <PropertyCard {...args} />
      </LinkLikeRow>
    </div>
  ),
};

function LinkLikeRow({ children }: { children: ReactNode }) {
  return (
    <div className="hover:bg-surface-muted/60 flex gap-3 px-4 py-3 transition-colors">
      {children}
    </div>
  );
}

export const ResponsiveGrid: Story = {
  render: (args) => (
    <div className="grid w-full max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <PropertyCard {...args} />
      <PropertyCard
        {...args}
        title="Share-house in Gangnam"
        propertyType="share-house"
        district="Gangnam-gu"
      />
      <PropertyCard
        {...args}
        title="Compact micro studio"
        propertyType="micro-studio"
        district="Jongno-gu"
      />
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};
