import type { Meta, StoryObj } from '@storybook/react';
import { Building, Home, Hotel, Users } from 'lucide-react';

import { AccommodationTypeCard } from './AccommodationTypeCard';

const meta: Meta<typeof AccommodationTypeCard> = {
  title: 'Features/Home/AccommodationTypeCard',
  component: AccommodationTypeCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    slug: {
      control: 'select',
      options: ['share-house', 'studio', 'micro-studio', 'multi-bedroom'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof AccommodationTypeCard>;

export const ShareHouse: Story = {
  args: {
    eyebrow: 'Stay in a',
    title: 'Share-house',
    description: 'Shared social spaces',
    icon: Users,
    slug: 'share-house',
  },
};

export const Studio: Story = {
  args: {
    eyebrow: 'Stay in a',
    title: 'Studio',
    description: 'A private room for rent',
    icon: Home,
    slug: 'studio',
  },
};

export const MicroStudio: Story = {
  args: {
    eyebrow: 'Stay in a',
    title: 'Micro Studio',
    description: 'Compact private living',
    icon: Hotel,
    slug: 'micro-studio',
  },
};

export const MultiBedroom: Story = {
  args: {
    eyebrow: 'Stay in a',
    title: 'Multi-bedroom',
    description: 'Space for groups',
    icon: Building,
    slug: 'multi-bedroom',
  },
};

export const AllTypes: Story = {
  args: {
    eyebrow: 'Stay in a',
    title: 'Share-house',
    description: 'Shared social spaces',
    icon: Users,
    slug: 'share-house',
  },
  render: () => (
    <div className="flex gap-4">
      <AccommodationTypeCard
        eyebrow="Stay in a"
        title="Share-house"
        description="Shared social spaces"
        icon={Users}
        slug="share-house"
      />
      <AccommodationTypeCard
        eyebrow="Stay in a"
        title="Studio"
        description="A private room for rent"
        icon={Home}
        slug="studio"
      />
      <AccommodationTypeCard
        eyebrow="Stay in a"
        title="Micro Studio"
        description="Compact private living"
        icon={Hotel}
        slug="micro-studio"
      />
      <AccommodationTypeCard
        eyebrow="Stay in a"
        title="Multi-bedroom"
        description="Space for groups"
        icon={Building}
        slug="multi-bedroom"
      />
    </div>
  ),
};
