import type { Meta, StoryObj } from '@storybook/react';

import { LocalizedPropertyCard } from './LocalizedPropertyCard';

const meta: Meta<typeof LocalizedPropertyCard> = {
  title: 'Shared/LocalizedPropertyCard',
  component: LocalizedPropertyCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    propertyType: {
      control: 'select',
      options: ['share-house', 'studio', 'micro-studio', 'multi-bedroom'],
    },
    variant: {
      control: 'select',
      options: ['default', 'horizontal', 'compact'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof LocalizedPropertyCard>;

const baseArgs = {
  title: 'Cozy Studio Near Hongdae Station',
  propertyType: 'studio' as const,
  district: 'Mapo-gu',
  nearestStationName: 'Hongdae',
  monthlyPriceMin: 650000,
  coverImageUrl: null,
  coverImageAlt: null,
  tags: ['Near metro', 'Utilities included'],
};

export const WithImage: Story = {
  args: {
    ...baseArgs,
    coverImageUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop',
    coverImageAlt: 'Modern studio apartment',
  },
};

export const WithoutImage: Story = {
  args: baseArgs,
};

export const ShareHouse: Story = {
  args: {
    ...baseArgs,
    title: 'Vibrant Share-house in Itaewon',
    propertyType: 'share-house',
    district: 'Yongsan-gu',
    nearestStationName: 'Itaewon',
    monthlyPriceMin: 450000,
    tags: ['Female only', 'Rooftop'],
  },
};

export const MultiBedroom: Story = {
  args: {
    ...baseArgs,
    title: 'Spacious 3BR Apartment in Gangnam',
    propertyType: 'multi-bedroom',
    district: 'Gangnam-gu',
    nearestStationName: 'Gangnam',
    monthlyPriceMin: 2500000,
    tags: ['Pet friendly', 'Parking'],
  },
};

export const HorizontalVariant: Story = {
  args: {
    ...baseArgs,
    variant: 'horizontal',
    coverImageUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop',
  },
};

export const CompactVariant: Story = {
  args: {
    ...baseArgs,
    variant: 'compact',
  },
};

export const Grid: Story = {
  args: baseArgs,
  render: (args) => (
    <div className="grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <LocalizedPropertyCard {...args} />
      <LocalizedPropertyCard
        {...args}
        title="Share-house Itaewon"
        propertyType="share-house"
        monthlyPriceMin={450000}
        coverImageUrl="https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop"
      />
      <LocalizedPropertyCard
        {...args}
        title="Micro Studio Sinchon"
        propertyType="micro-studio"
        monthlyPriceMin={380000}
      />
    </div>
  ),
};
