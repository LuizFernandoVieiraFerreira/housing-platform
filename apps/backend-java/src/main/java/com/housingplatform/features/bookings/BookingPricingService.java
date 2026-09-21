package com.housingplatform.features.bookings;

import com.housingplatform.shared.auth.error.BadRequestException;
import com.housingplatform.features.bookings.model.BookingPrice;
import com.housingplatform.persistence.entity.PlatformSetting;
import com.housingplatform.persistence.repository.PlatformSettingRepository;
import org.springframework.stereotype.Service;

@Service
public class BookingPricingService {

  private static final short PLATFORM_SETTINGS_ID = 1;

  private final PlatformSettingRepository platformSettingRepository;

  public BookingPricingService(PlatformSettingRepository platformSettingRepository) {
    this.platformSettingRepository = platformSettingRepository;
  }

  public BookingPrice calculatePrice(int monthlyPriceKrw, int nights) {
    if (monthlyPriceKrw <= 0) {
      throw new BadRequestException("Monthly price must be positive");
    }
    if (nights <= 0) {
      throw new BadRequestException("Stay length must be positive");
    }

    PlatformSetting settings =
        platformSettingRepository
            .findById(PLATFORM_SETTINGS_ID)
            .orElseThrow(() -> new BadRequestException("Platform settings are not configured"));

    int rentKrw = roundDownToThousands((monthlyPriceKrw / 30.0) * nights);
    int serviceFeeKrw =
        roundDownToThousands(rentKrw * settings.getServiceFeeBps() / 10_000.0);
    int totalKrw = rentKrw + serviceFeeKrw;

    return new BookingPrice(rentKrw, serviceFeeKrw, totalKrw, settings.getPricingVersion());
  }

  public int getHoldTtlMinutes() {
    return platformSettingRepository
        .findById(PLATFORM_SETTINGS_ID)
        .map(PlatformSetting::getHoldTtlMinutes)
        .orElseThrow(() -> new BadRequestException("Platform settings are not configured"));
  }

  private static int roundDownToThousands(double value) {
    return (int) (Math.floor(value / 1000.0) * 1000);
  }
}
