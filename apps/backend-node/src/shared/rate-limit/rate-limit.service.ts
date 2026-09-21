import { Injectable } from '@nestjs/common';

import { PrismaService } from '@/prisma/prisma.service';
import { RateLimitedError } from '@/shared/errors';

@Injectable()
export class RateLimitService {
  constructor(private readonly prisma: PrismaService) {}

  async assertRateLimit(
    bucket: string,
    maxRequests: number,
    windowSeconds: number,
  ): Promise<void> {
    const trimmed = bucket.trim();
    if (!trimmed || maxRequests <= 0 || windowSeconds <= 0) {
      throw new RateLimitedError();
    }

    const now = new Date();
    const windowStartEpoch =
      Math.floor(now.getTime() / 1000 / windowSeconds) * windowSeconds;
    const windowStart = new Date(windowStartEpoch * 1000);

    const rows = await this.prisma.$queryRaw<Array<{ request_count: number }>>`
      INSERT INTO public.api_rate_limits (bucket, window_start, request_count)
      VALUES (${trimmed}, ${windowStart}, 1)
      ON CONFLICT (bucket, window_start)
      DO UPDATE SET request_count = public.api_rate_limits.request_count + 1
      RETURNING request_count
    `;

    const count = rows[0]?.request_count ?? 0;
    if (count > maxRequests) {
      throw new RateLimitedError();
    }
  }
}
