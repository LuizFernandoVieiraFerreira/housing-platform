import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { BadRequestError } from '../../shared/errors';

const PLATFORM_SETTINGS_ID = 1;

export interface BookingPrice {
  rentKrw: number;
  serviceFeeKrw: number;
  totalKrw: number;
  pricingVersion: string;
}

@Injectable()
export class BookingPricingService {
  constructor(private readonly prisma: PrismaService) {}

  async calculatePrice(
    monthlyPriceKrw: number,
    nights: number,
  ): Promise<BookingPrice> {
    if (monthlyPriceKrw <= 0) {
      throw new BadRequestError('Monthly price must be positive');
    }

    if (nights <= 0) {
      throw new BadRequestError('Stay length must be positive');
    }

    const settings = await this.getPlatformSettings();
    const rentKrw = roundDownToThousands((monthlyPriceKrw / 30) * nights);
    const serviceFeeKrw = roundDownToThousands(
      rentKrw * (settings.service_fee_bps / 10_000),
    );

    return {
      rentKrw,
      serviceFeeKrw,
      totalKrw: rentKrw + serviceFeeKrw,
      pricingVersion: settings.pricing_version,
    };
  }

  async getHoldTtlMinutes(): Promise<number> {
    const settings = await this.getPlatformSettings();
    return settings.hold_ttl_minutes;
  }

  private async getPlatformSettings() {
    const settings = await this.prisma.platform_settings.findUnique({
      where: { id: PLATFORM_SETTINGS_ID },
    });

    if (!settings) {
      throw new BadRequestError('Platform settings are not configured');
    }

    return settings;
  }
}

function roundDownToThousands(value: number): number {
  return Math.floor(value / 1000) * 1000;
}
