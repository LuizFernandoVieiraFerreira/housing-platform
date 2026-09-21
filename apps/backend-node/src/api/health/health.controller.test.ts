import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { PrismaService } from '../../prisma/prisma.service';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;
  let prisma: { isDatabaseHealthy: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    prisma = {
      isDatabaseHealthy: vi.fn(),
    };

    controller = new HealthController(prisma as unknown as PrismaService);
  });

  it('returns ok when the database is reachable', async () => {
    prisma.isDatabaseHealthy.mockResolvedValue(true);

    await expect(controller.health()).resolves.toEqual({
      status: 'ok',
      database: true,
    });
  });

  it('returns degraded when the database is unreachable', async () => {
    prisma.isDatabaseHealthy.mockResolvedValue(false);

    await expect(controller.health()).resolves.toEqual({
      status: 'degraded',
      database: false,
    });
  });
});
