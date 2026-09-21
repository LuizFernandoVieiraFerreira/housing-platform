package com.housingplatform.authorization;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.housingplatform.api.error.GlobalExceptionHandler;
import com.housingplatform.auth.jwt.SupabaseJwtValidator;
import com.housingplatform.auth.model.AuthenticatedUser;
import com.housingplatform.auth.security.SecurityConfig;
import com.housingplatform.auth.security.SupabaseJwtAuthenticationFilter;
import com.housingplatform.auth.support.TestJwtFactory;
import com.housingplatform.config.AppProperties;
import com.housingplatform.notifications.NotificationController;
import com.housingplatform.notifications.NotificationService;
import com.housingplatform.persistence.entity.Notification;
import com.housingplatform.persistence.enums.NotificationType;
import com.housingplatform.persistence.repository.NotificationRepository;
import com.housingplatform.persistence.repository.ProfileRepository;
import java.time.OffsetDateTime;
import java.util.Map;
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
    controllers = NotificationController.class,
    excludeAutoConfiguration = {
      DataSourceAutoConfiguration.class,
      HibernateJpaAutoConfiguration.class
    })
@Import({
  NotificationService.class,
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
class NotificationAuthorizationTest {

  @Autowired private MockMvc mockMvc;

  @MockitoBean private NotificationRepository notificationRepository;

  @MockitoBean private ProfileRepository profileRepository;

  @MockitoBean private com.housingplatform.persistence.repository.HostRepository hostRepository;

  @MockitoBean private com.housingplatform.persistence.repository.PropertyRepository propertyRepository;

  @MockitoBean private com.housingplatform.persistence.repository.BookingRepository bookingRepository;

  private UUID customerId;
  private AuthenticatedUser customer;

  @BeforeEach
  void setUp() throws Exception {
    customerId = UUID.randomUUID();
    customer = AuthorizationMvcTestSupport.customer(customerId);
    AuthorizationMvcTestSupport.stubAuthUser(profileRepository, customer);
  }

  @Test
  void customerCannotMarkAnotherUsersNotificationRead() throws Exception {
    UUID notificationId = UUID.randomUUID();
    when(notificationRepository.markRead(customerId, notificationId)).thenReturn(0);
    when(notificationRepository.findByIdAndUserId(notificationId, customerId))
        .thenReturn(Optional.empty());

    mockMvc
        .perform(
            post(AuthorizationMvcTestSupport.API + "/notifications/" + notificationId + "/read")
                .with(AuthorizationMvcTestSupport.bearerToken(customer)))
        .andExpect(status().isNotFound())
        .andExpect(jsonPath("$.error.code").value("NOT_FOUND"));
  }

  @Test
  void markReadScopesToAuthenticatedUser() throws Exception {
    UUID notificationId = UUID.randomUUID();
    Notification notification = mock(Notification.class);
    when(notification.getId()).thenReturn(notificationId);
    when(notification.getUserId()).thenReturn(customerId);
    when(notification.getType()).thenReturn(NotificationType.booking_request);
    when(notification.getTitle()).thenReturn("New booking request");
    when(notification.getBody()).thenReturn("A guest requested a booking.");
    when(notification.getMetadata()).thenReturn(Map.of());
    when(notification.getCreatedAt()).thenReturn(OffsetDateTime.now());
    when(notificationRepository.markRead(customerId, notificationId)).thenReturn(1);
    when(notificationRepository.findByIdAndUserId(notificationId, customerId))
        .thenReturn(Optional.of(notification));

    mockMvc
        .perform(
            post(AuthorizationMvcTestSupport.API + "/notifications/" + notificationId + "/read")
                .with(AuthorizationMvcTestSupport.bearerToken(customer)))
        .andExpect(status().isOk());

    verify(notificationRepository).markRead(eq(customerId), eq(notificationId));
  }
}
