package com.housingplatform.authorization;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.housingplatform.api.error.GlobalExceptionHandler;
import com.housingplatform.auth.jwt.SupabaseJwtValidator;
import com.housingplatform.auth.model.AuthenticatedUser;
import com.housingplatform.auth.security.SecurityConfig;
import com.housingplatform.auth.security.SupabaseJwtAuthenticationFilter;
import com.housingplatform.auth.support.TestJwtFactory;
import com.housingplatform.persistence.enums.UserRole;
import com.housingplatform.bookings.BookingController;
import com.housingplatform.bookings.BookingRepository;
import com.housingplatform.bookings.BookingService;
import com.housingplatform.config.AppProperties;
import com.housingplatform.persistence.entity.Booking;
import com.housingplatform.persistence.enums.BookingStatus;
import com.housingplatform.persistence.enums.BookingType;
import com.housingplatform.shared.RateLimitService;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;
import org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(
    controllers = BookingController.class,
    excludeAutoConfiguration = {
      DataSourceAutoConfiguration.class,
      HibernateJpaAutoConfiguration.class
    })
@Import({
  BookingService.class,
  AuthorizationTestConfig.class,
  SecurityConfig.class,
  SupabaseJwtAuthenticationFilter.class,
  SupabaseJwtValidator.class,
  GlobalExceptionHandler.class
})
@EnableConfigurationProperties(AppProperties.class)
@TestPropertySource(
    properties = {
      "housing-platform.api-prefix=/api/v1",
      "housing-platform.supabase-url=" + TestJwtFactory.SUPABASE_URL,
      "housing-platform.supabase-jwt-secret=" + TestJwtFactory.JWT_SECRET,
      "housing-platform.supabase-jwt-audience=authenticated"
    })
class BookingAuthorizationTest {

  @Autowired private MockMvc mockMvc;

  @MockitoBean private BookingRepository bookingRepository;

  @MockitoBean private com.housingplatform.persistence.repository.ProfileRepository profileRepository;

  @MockitoBean private com.housingplatform.persistence.repository.HostRepository hostRepository;

  @MockitoBean private com.housingplatform.persistence.repository.PropertyRepository propertyRepository;

  @MockitoBean private com.housingplatform.persistence.repository.BookingRepository authBookingRepository;

  @MockitoBean private RateLimitService rateLimitService;

  private UUID customerId;
  private AuthenticatedUser customer;

  @BeforeEach
  void setUp() throws Exception {
    customerId = UUID.randomUUID();
    customer = AuthorizationMvcTestSupport.customer(customerId);
  }

  @Test
  void customerCannotViewAnotherCustomersBooking() throws Exception {
    UUID bookingId = UUID.randomUUID();
    when(bookingRepository.findBookingDetailRow(bookingId))
        .thenReturn(Optional.of(bookingListRow(UUID.randomUUID())));
    when(profileRepository.existsActiveByIdAndRole(customerId, UserRole.admin)).thenReturn(false);
    when(propertyRepository.existsForHostProfile(eq(customerId), any())).thenReturn(false);
    AuthorizationMvcTestSupport.stubAuthUser(profileRepository, customer);

    mockMvc
        .perform(
            get(AuthorizationMvcTestSupport.API + "/bookings/" + bookingId)
                .with(AuthorizationMvcTestSupport.bearerToken(customer)))
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.error.code").value("FORBIDDEN"));
  }

  @Test
  void customerCannotCancelAnotherCustomersBooking() throws Exception {
    UUID bookingId = UUID.randomUUID();
    Booking booking = mock(Booking.class);
    when(booking.getCustomerId()).thenReturn(UUID.randomUUID());
    when(bookingRepository.findBooking(bookingId)).thenReturn(Optional.of(booking));
    AuthorizationMvcTestSupport.stubAuthUser(profileRepository, customer);

    mockMvc
        .perform(
            post(AuthorizationMvcTestSupport.API + "/bookings/" + bookingId + "/cancel")
                .with(AuthorizationMvcTestSupport.bearerToken(customer)))
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.error.code").value("FORBIDDEN"));
  }

  @Test
  void customerCannotCancelConfirmedBooking() throws Exception {
    UUID bookingId = UUID.randomUUID();
    Booking booking = mock(Booking.class);
    when(booking.getCustomerId()).thenReturn(customerId);
    when(bookingRepository.findBooking(bookingId)).thenReturn(Optional.of(booking));
    when(bookingRepository.cancelBooking(bookingId, customerId)).thenReturn(null);
    AuthorizationMvcTestSupport.stubAuthUser(profileRepository, customer);

    mockMvc
        .perform(
            post(AuthorizationMvcTestSupport.API + "/bookings/" + bookingId + "/cancel")
                .with(AuthorizationMvcTestSupport.bearerToken(customer)))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"));
  }

  @Test
  void customerCannotApproveBooking() throws Exception {
    UUID bookingId = UUID.randomUUID();
    Booking booking = mock(Booking.class);
    when(bookingRepository.findBooking(bookingId)).thenReturn(Optional.of(booking));
    when(profileRepository.existsActiveByIdAndRole(customerId, UserRole.admin)).thenReturn(false);
    when(authBookingRepository.findPropertyIdById(bookingId)).thenReturn(Optional.empty());
    AuthorizationMvcTestSupport.stubAuthUser(profileRepository, customer);

    mockMvc
        .perform(
            post(AuthorizationMvcTestSupport.API + "/bookings/" + bookingId + "/approve")
                .with(AuthorizationMvcTestSupport.bearerToken(customer)))
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.error.code").value("FORBIDDEN"));
  }

  private static BookingRepository.BookingListRow bookingListRow(UUID customerId) {
    return new BookingRepository.BookingListRow(
        UUID.randomUUID(),
        customerId,
        BookingStatus.requested,
        BookingType.request,
        LocalDate.of(2026, 10, 1),
        LocalDate.of(2026, 11, 1),
        1,
        null,
        OffsetDateTime.now(),
        null,
        UUID.randomUUID(),
        UUID.randomUUID(),
        "Test Property",
        "Mapo-gu",
        "Room A",
        930_000,
        93_000,
        1_023_000,
        "v1");
  }
}
