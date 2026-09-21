package com.housingplatform.bookings;

import com.housingplatform.auth.error.BadRequestException;
import com.housingplatform.auth.error.NotFoundException;
import com.housingplatform.bookings.model.BookingInputs;
import com.housingplatform.persistence.entity.Property;
import com.housingplatform.persistence.entity.Room;
import com.housingplatform.persistence.enums.PropertyStatus;
import com.housingplatform.persistence.enums.RoomStatus;
import com.housingplatform.persistence.repository.PropertyRepository;
import com.housingplatform.persistence.repository.RoomRepository;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class BookingValidationService {

  private final RoomRepository roomRepository;
  private final PropertyRepository propertyRepository;

  public BookingValidationService(
      RoomRepository roomRepository, PropertyRepository propertyRepository) {
    this.roomRepository = roomRepository;
    this.propertyRepository = propertyRepository;
  }

  public BookingInputs validateInputs(
      UUID roomId, LocalDate checkIn, LocalDate checkOut, int guestCount) {
    if (!checkOut.isAfter(checkIn)) {
      throw new BadRequestException("checkOut must be after checkIn");
    }
    if (guestCount <= 0) {
      throw new BadRequestException("guestCount must be positive");
    }

    Room room =
        roomRepository
            .findByIdAndDeletedAtIsNullAndStatus(roomId, RoomStatus.available)
            .orElseThrow(() -> new NotFoundException("Room is not available"));

    Property property =
        propertyRepository
            .findByIdAndDeletedAtIsNullAndStatus(room.getPropertyId(), PropertyStatus.published)
            .orElseThrow(() -> new NotFoundException("Property is not published"));

    int nights = (int) ChronoUnit.DAYS.between(checkIn, checkOut);
    if (nights < property.getMinStayNights()) {
      throw new BadRequestException(
          "Stay must be at least " + property.getMinStayNights() + " nights");
    }
    if (guestCount > room.getMaxOccupancy()) {
      throw new BadRequestException("Room supports up to " + room.getMaxOccupancy() + " guests");
    }
    if (room.getAvailableFrom() != null && room.getAvailableFrom().isAfter(checkIn)) {
      throw new BadRequestException("Room is not available from the selected check-in date");
    }

    return new BookingInputs(
        room.getId(),
        property.getId(),
        property.getBookingMode().name(),
        property.getMinStayNights(),
        room.getMonthlyPriceKrw(),
        room.getMaxOccupancy(),
        nights);
  }
}
