package com.housingplatform.bookings;

import com.housingplatform.persistence.entity.Booking;
import com.housingplatform.persistence.entity.Host;
import com.housingplatform.persistence.entity.Notification;
import com.housingplatform.persistence.entity.Profile;
import com.housingplatform.persistence.entity.Property;
import com.housingplatform.persistence.entity.support.NotificationFactory;
import com.housingplatform.persistence.enums.NotificationType;
import com.housingplatform.persistence.repository.NotificationRepository;
import com.housingplatform.persistence.repository.ProfileRepository;
import com.housingplatform.persistence.repository.PropertyRepository;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class BookingNotificationService {

  private static final DateTimeFormatter DATE_FORMAT =
      DateTimeFormatter.ofPattern("MMM dd, yyyy", Locale.ENGLISH);

  private final NotificationRepository notificationRepository;
  private final PropertyRepository propertyRepository;
  private final ProfileRepository profileRepository;

  public BookingNotificationService(
      NotificationRepository notificationRepository,
      PropertyRepository propertyRepository,
      ProfileRepository profileRepository) {
    this.notificationRepository = notificationRepository;
    this.propertyRepository = propertyRepository;
    this.profileRepository = profileRepository;
  }

  public void notifyBookingRequest(Booking booking) {
    Property property =
        propertyRepository.findById(booking.getPropertyId()).orElse(null);
    if (property == null || property.getHost() == null) {
      return;
    }

    Host host = property.getHost();
    Profile hostProfile = host.getProfile();
    if (hostProfile == null) {
      return;
    }

    String guestName =
        profileRepository
            .findActiveById(booking.getCustomerId())
            .map(Profile::getFullName)
            .map(String::trim)
            .filter(name -> !name.isEmpty())
            .orElse("A guest");

    Notification notification =
        NotificationFactory.create(
            hostProfile,
            NotificationType.booking_request,
            "New booking request",
            "%s requested to stay at %s (%s – %s)"
                .formatted(
                    guestName,
                    property.getTitle(),
                    DATE_FORMAT.format(booking.getCheckIn()),
                    DATE_FORMAT.format(booking.getCheckOut())),
            Map.of("bookingId", booking.getId().toString()));

    notificationRepository.save(notification);
  }

  public void notifyBookingConfirmed(Booking booking) {
    Property property =
        propertyRepository.findById(booking.getPropertyId()).orElse(null);
    if (property == null) {
      return;
    }

    String hostName =
        property.getHost() == null || property.getHost().getDisplayName() == null
            ? "Your host"
            : property.getHost().getDisplayName().strip();
    if (hostName.isEmpty()) {
      hostName = "Your host";
    }

    Profile customer =
        profileRepository.findActiveById(booking.getCustomerId()).orElse(null);
    if (customer == null) {
      return;
    }

    Notification notification =
        NotificationFactory.create(
            customer,
            NotificationType.booking_confirmed,
            "Booking confirmed",
            "%s confirmed your booking for %s, %s – %s"
                .formatted(
                    hostName,
                    property.getTitle(),
                    DATE_FORMAT.format(booking.getCheckIn()),
                    DATE_FORMAT.format(booking.getCheckOut())),
            Map.of("bookingId", booking.getId().toString()));

    notificationRepository.save(notification);
  }

  public void notifyBookingRejected(Booking booking) {
    Property property =
        propertyRepository.findById(booking.getPropertyId()).orElse(null);
    if (property == null) {
      return;
    }

    Profile customer =
        profileRepository.findActiveById(booking.getCustomerId()).orElse(null);
    if (customer == null) {
      return;
    }

    Notification notification =
        NotificationFactory.create(
            customer,
            NotificationType.booking_rejected,
            "Booking request declined",
            "Your request to stay at %s (%s – %s) was declined"
                .formatted(
                    property.getTitle(),
                    DATE_FORMAT.format(booking.getCheckIn()),
                    DATE_FORMAT.format(booking.getCheckOut())),
            Map.of("bookingId", booking.getId().toString()));

    notificationRepository.save(notification);
  }
}
