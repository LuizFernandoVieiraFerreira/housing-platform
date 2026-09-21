package com.housingplatform.shared.auth.security;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.housingplatform.api.error.GlobalExceptionHandler;
import com.housingplatform.shared.auth.jwt.SupabaseJwtValidator;
import com.housingplatform.shared.auth.model.AuthenticatedUser;
import com.housingplatform.shared.auth.service.AuthorizationService;
import com.housingplatform.config.AppProperties;
import com.housingplatform.shared.auth.support.TestJwtFactory;
import com.housingplatform.persistence.enums.UserRole;
import java.util.UUID;
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
    controllers = AuthProbeController.class,
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
class SupabaseJwtAuthenticationFilterTest {

  @Autowired private MockMvc mockMvc;

  @MockitoBean private AuthorizationService authorizationService;

  @Test
  void protectedRouteReturnsUnauthenticatedErrorWithoutToken() throws Exception {
    mockMvc
        .perform(get("/api/v1/protected"))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.error.code").value("UNAUTHENTICATED"));
  }

  @Test
  void optionalRouteAllowsAnonymousAccess() throws Exception {
    mockMvc
        .perform(get("/api/v1/optional"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.userId").value(""));
  }

  @Test
  void protectedRouteRejectsInvalidToken() throws Exception {
    mockMvc
        .perform(get("/api/v1/protected").header("Authorization", "Bearer not-a-valid-token"))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.error.code").value("UNAUTHENTICATED"));
  }

  @Test
  void protectedRouteAcceptsValidToken() throws Exception {
    UUID userId = UUID.randomUUID();
    String token = TestJwtFactory.buildToken(userId);
    when(authorizationService.resolveAuthUser(eq(userId), eq("test@example.com")))
        .thenReturn(new AuthenticatedUser(userId, "test@example.com", UserRole.customer));

    mockMvc
        .perform(get("/api/v1/protected").header("Authorization", "Bearer " + token))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.userId").value(userId.toString()))
        .andExpect(jsonPath("$.role").value("customer"));
  }

  @Test
  void optionalRouteRejectsInvalidTokenWhenProvided() throws Exception {
    mockMvc
        .perform(get("/api/v1/optional").header("Authorization", "Bearer not-a-valid-token"))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.error.code").value("UNAUTHENTICATED"));
  }

  @Test
  void protectedRouteRejectsMissingProfile() throws Exception {
    UUID userId = UUID.randomUUID();
    String token = TestJwtFactory.buildToken(userId);
    when(authorizationService.resolveAuthUser(any(), any()))
        .thenThrow(new com.housingplatform.shared.auth.error.UnauthenticatedException("User profile not found"));

    mockMvc
        .perform(get("/api/v1/protected").header("Authorization", "Bearer " + token))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.error.message").value("User profile not found"));
  }
}
