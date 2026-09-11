import { screen } from '@testing-library/react';
import { DoorOpen } from 'lucide-react';
import { describe, expect, it } from 'vitest';
import type { AccommodationType } from '@housing-platform/types';

import { AccommodationTypeCard } from '@/features/home/components/AccommodationTypeCard';
import { expectMapHrefContract } from '@/test/map-link-contract';
import { renderWithProviders } from '@/test/render';

describe('AccommodationTypeCard', () => {
  it.each([
    'share-house',
    'studio',
    'micro-studio',
    'multi-bedroom',
  ] as const satisfies readonly AccommodationType[])(
    'links %s through the canonical map search params',
    (slug) => {
      renderWithProviders(
        <AccommodationTypeCard
          eyebrow="Stay in a"
          title={slug}
          description="Description"
          icon={DoorOpen}
          slug={slug}
        />,
      );

      const link = screen.getByRole('link');
      expect(link).toHaveClass(`bg-marketing-${slug}`);

      const { filters } = expectMapHrefContract(link.getAttribute('href'));
      expect(filters.propertyType).toBe(slug);
      expect(filters.centerLat).toBeDefined();
      expect(filters.centerLng).toBeDefined();
    },
  );
});
