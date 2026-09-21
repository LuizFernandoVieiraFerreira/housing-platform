package com.housingplatform.authorization;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.housingplatform.api.error.GlobalExceptionHandler;
import com.housingplatform.shared.auth.jwt.SupabaseJwtValidator;
import com.housingplatform.shared.auth.model.AuthenticatedUser;
import com.housingplatform.shared.auth.security.SecurityConfig;
import com.housingplatform.shared.auth.security.SupabaseJwtAuthenticationFilter;
import com.housingplatform.shared.auth.support.TestJwtFactory;
import com.housingplatform.config.AppProperties;
import com.housingplatform.features.payments.PaymentController;
import com.housingplatform.persistence.repository.PaymentRepository;
import com.housingplatform.persistence.repository.PaymentRepositoryCustom;
import com.housingplatform.features.payments.PaymentService;
import com.housingplatform.features.payments.TossClient;
import com.housingplatform.persistence.enums.PaymentStatus;
import com.housingplatform.shared.RateLimitService;
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
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(
    controllers = PaymentController.class,
    excludeAutoConfiguration = {
      DataSourceAutoConfiguration.class,
      HibernateJpaAutoConfiguration.class
    })
@Import({
  PaymentService.class,
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
class PaymentAuthorizationTest {

  @Autowired private MockMvc mockMvc;

  @MockitoBean private PaymentRepository paymentRepository;

  @MockitoBean private com.housingplatform.features.payments.PaymentFinalizationService paymentFinalizationService;

  @MockitoBean private RateLimitService rateLimitService;

  @MockitoBean private TossClient tossClient;

  @MockitoBean private com.housingplatform.persistence.repository.ProfileRepository profileRepository;

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
  void customerCannotCreatePaymentOrderForForeignBooking() throws Exception {
    UUID bookingId = UUID.randomUUID();
    when(paymentRepository.createPaymentOrder(bookingId, customerId))
        .thenThrow(new com.housingplatform.shared.auth.error.ForbiddenException("Booking not found"));

    mockMvc
        .perform(
            post(AuthorizationMvcTestSupport.API + "/payments/orders")
                .with(AuthorizationMvcTestSupport.bearerToken(customer))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"bookingId\":\"" + bookingId + "\"}"))
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.error.code").value("FORBIDDEN"));
  }

  @Test
  void customerCannotConfirmForeignPayment() throws Exception {
    UUID orderId = UUID.randomUUID();
    when(paymentRepository.findByOrderId(orderId))
        .thenReturn(
            Optional.of(
                new PaymentRepositoryCustom.PaymentLookupRow(
                    UUID.randomUUID(),
                    orderId,
                    UUID.randomUUID(),
                    UUID.randomUUID(),
                    1_023_000,
                    PaymentStatus.pending)));

    mockMvc
        .perform(
            post(AuthorizationMvcTestSupport.API + "/payments/confirm")
                .with(AuthorizationMvcTestSupport.bearerToken(customer))
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {
                      "paymentKey": "pay_key",
                      "orderId": "%s",
                      "amount": 1023000
                    }
                    """
                        .formatted(orderId)))
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.error.code").value("FORBIDDEN"));
  }

  @Test
  void confirmPaymentIsNotFoundForUnknownOrder() throws Exception {
    UUID orderId = UUID.randomUUID();
    when(paymentRepository.findByOrderId(orderId)).thenReturn(Optional.empty());

    mockMvc
        .perform(
            post(AuthorizationMvcTestSupport.API + "/payments/confirm")
                .with(AuthorizationMvcTestSupport.bearerToken(customer))
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {
                      "paymentKey": "pay_key",
                      "orderId": "%s",
                      "amount": 1023000
                    }
                    """
                        .formatted(orderId)))
        .andExpect(status().isNotFound())
        .andExpect(jsonPath("$.error.code").value("NOT_FOUND"));
  }
}
