import { Controller, Get } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { Public } from '../../shared/auth/public.decorator';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  async health(): Promise<{ status: string; database: boolean }> {
    const databaseOk = await this.prisma.isDatabaseHealthy();

    return {
      status: databaseOk ? 'ok' : 'degraded',
      database: databaseOk,
    };
  }
}
