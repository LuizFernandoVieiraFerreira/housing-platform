package com.housingplatform.contract;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.housingplatform.api.error.GlobalExceptionHandler;
import com.housingplatform.auth.jwt.SupabaseJwtValidator;
import com.housingplatform.auth.model.AuthenticatedUser;
import com.housingplatform.auth.security.SecurityConfig;
import com.housingplatform.auth.security.SupabaseJwtAuthenticationFilter;
import com.housingplatform.auth.service.AuthorizationService;
import com.housingplatform.auth.support.TestJwtFactory;
import com.housingplatform.bookings.BookingController;
import com.housingplatform.config.AppProperties;
import com.housingplatform.payments.PaymentController;
import com.housingplatform.payments.PaymentService;
import com.housingplatform.persistence.enums.UserRole;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
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

class ContractTest {

  @Test
  void canonicalOpenApiDocumentIsValid() {
    Map<String, Object> document = ContractSupport.loadCanonicalOpenApi();

    assertThat(document.get("openapi")).isEqualTo("3.1.0");
    assertThat(Files.exists(ContractSupport.canonicalOpenApiPath())).isTrue();
    assertThat(document.get("paths")).isInstanceOf(Map.class);
  }

  @ParameterizedTest
  @MethodSource("requiredOperations")
  void springMvcExposesRequiredContractOperation(ContractSupport.OperationKey operation) {
    Map<ContractSupport.OperationKey, String> operations =
        SpringMvcOperationScanner.scanOperations(ContractSupport.API_PREFIX);

    assertThat(operations)
        .as("Missing %s %s", operation.method().toUpperCase(), operation.normalizedPath())
        .containsKey(operation);
  }

  @Test
  void springMvcPathsAreDefinedInCanonicalContract() {
    Map<ContractSupport.OperationKey, String> canonical =
        ContractSupport.listPathOperations(ContractSupport.loadCanonicalOpenApi());
    Map<ContractSupport.OperationKey, String> spring =
        SpringMvcOperationScanner.scanOperations(ContractSupport.API_PREFIX);

    List<String> undefined = new ArrayList<>();
    for (Map.Entry<ContractSupport.OperationKey, String> entry : spring.entrySet()) {
      if (entry.getKey().normalizedPath().endsWith("/health")) {
        continue;
      }
      if (!canonical.containsKey(entry.getKey())) {
        undefined.add(entry.getKey().method().toUpperCase() + " " + entry.getValue());
      }
    }

    assertThat(undefined)
        .withFailMessage(
            "Spring MVC exposes routes that are not in the canonical contract:%n%s",
            String.join(System.lineSeparator(), undefined))
        .isEmpty();
  }

  static List<ContractSupport.OperationKey> requiredOperations() {
    return ContractSupport.REQUIRED_OPERATIONS;
  }

  @WebMvcTest(
      controllers = BookingController.class,
      excludeAutoConfiguration = {
        DataSourceAutoConfiguration.class,
        HibernateJpaAutoConfiguration.class
      })
  @Import({
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
  static class ErrorEnvelopeTest {

    @Autowired private MockMvc mockMvc;

    @MockitoBean private com.housingplatform.bookings.BookingService bookingService;

    @MockitoBean private AuthorizationService authorizationService;

    @Test
    void unauthenticatedErrorMatchesContractEnvelope() throws Exception {
      mockMvc
          .perform(get("/api/v1/bookings"))
          .andExpect(status().isUnauthorized())
          .andExpect(jsonPath("$.error.code").value("UNAUTHENTICATED"));
    }
  }

  @WebMvcTest(
      controllers = PaymentController.class,
      excludeAutoConfiguration = {
        DataSourceAutoConfiguration.class,
        HibernateJpaAutoConfiguration.class
      })
  @Import({
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
  static class ValidationErrorEnvelopeTest {

    @Autowired private MockMvc mockMvc;

    @MockitoBean private PaymentService paymentService;

    @MockitoBean private AuthorizationService authorizationService;

    @Test
    void validationErrorMatchesContractEnvelope() throws Exception {
      UUID userId = UUID.randomUUID();
      String token = TestJwtFactory.buildToken(userId);
      org.mockito.Mockito.when(
              authorizationService.resolveAuthUser(
                  org.mockito.ArgumentMatchers.eq(userId),
                  org.mockito.ArgumentMatchers.any()))
          .thenReturn(new AuthenticatedUser(userId, "customer@example.com", UserRole.customer));

      String response =
          mockMvc
              .perform(
                  post("/api/v1/payments/orders")
                      .header("Authorization", "Bearer " + token)
                      .contentType(MediaType.APPLICATION_JSON)
                      .content("{}"))
              .andExpect(status().isBadRequest())
              .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"))
              .andReturn()
              .getResponse()
              .getContentAsString();

      ContractSupport.assertErrorEnvelope(new ObjectMapper().readValue(response, Map.class));
    }
  }
}
