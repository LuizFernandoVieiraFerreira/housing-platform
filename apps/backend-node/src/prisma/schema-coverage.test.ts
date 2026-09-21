import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const EXPECTED_PUBLIC_TABLES = [
  'amenities',
  'api_rate_limits',
  'audit_logs',
  'booking_price_snapshots',
  'bookings',
  'hosts',
  'housing_requests',
  'location_aliases',
  'notifications',
  'payment_events',
  'payments',
  'platform_settings',
  'profiles',
  'properties',
  'property_amenities',
  'property_images',
  'property_search_embeddings',
  'room_images',
  'rooms',
];

describe('prisma schema coverage', () => {
  it('maps all public application tables', () => {
    const schema = readFileSync(join(process.cwd(), 'prisma/schema.prisma'), 'utf8');
    const models = [...schema.matchAll(/^model\s+(\w+)\s+\{/gm)].map((match) => match[1]);

    expect(models.sort()).toEqual(EXPECTED_PUBLIC_TABLES.sort());
  });

  it('does not include auth schema models', () => {
    const schema = readFileSync(join(process.cwd(), 'prisma/schema.prisma'), 'utf8');

    expect(schema).not.toContain('@@schema("auth")');
    expect(schema).toContain('schemas  = ["public"]');
  });

  it('keeps geography and vector as Unsupported vendor types', () => {
    const schema = readFileSync(join(process.cwd(), 'prisma/schema.prisma'), 'utf8');

    expect(schema).toContain('Unsupported("extensions.geography(Point,4326)")');
    expect(schema).toContain('Unsupported("extensions.vector(1536)")');
  });
});
