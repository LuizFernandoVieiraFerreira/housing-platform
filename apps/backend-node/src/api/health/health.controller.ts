import { Controller, Get } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async health(): Promise<{ status: string; database: boolean }> {
    const databaseOk = await this.prisma.isDatabaseHealthy();

    return {
      status: databaseOk ? 'ok' : 'degraded',
      database: databaseOk,
    };
  }
}
