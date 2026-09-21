package com.housingplatform.shared.auth.jwt;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.housingplatform.shared.auth.error.UnauthenticatedException;
import com.housingplatform.shared.auth.model.JwtClaims;
import com.housingplatform.shared.auth.support.TestJwtFactory;
import com.housingplatform.config.AppProperties;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class SupabaseJwtValidatorTest {

  private SupabaseJwtValidator validator;

  @BeforeEach
  void setUp() {
    validator =
        new SupabaseJwtValidator(
            new AppProperties(
                "/api/v1",
                "http://localhost:5173",
                TestJwtFactory.SUPABASE_URL,
                TestJwtFactory.JWT_SECRET,
                "authenticated",
                "",
                false));
  }

  @Test
  void validateAcceptsAuthenticatedUserToken() throws Exception {
    UUID userId = UUID.randomUUID();
    String token = TestJwtFactory.buildToken(userId);

    JwtClaims claims = validator.validate(token);

    assertThat(claims.userId()).isEqualTo(userId);
    assertThat(claims.email()).isEqualTo("test@example.com");
  }

  @Test
  void validateRejectsExpiredToken() throws Exception {
    String token =
        TestJwtFactory.buildToken(
            UUID.randomUUID(), "authenticated", true, "authenticated", TestJwtFactory.JWT_SECRET);

    assertThatThrownBy(() -> validator.validate(token))
        .isInstanceOf(UnauthenticatedException.class)
        .hasMessageContaining("Invalid or expired");
  }

  @Test
  void validateRejectsServiceRoleToken() throws Exception {
    String token =
        TestJwtFactory.buildToken(
            UUID.randomUUID(), "service_role", false, "authenticated", TestJwtFactory.JWT_SECRET);

    assertThatThrownBy(() -> validator.validate(token))
        .isInstanceOf(UnauthenticatedException.class)
        .hasMessageContaining("not for an authenticated user");
  }

  @Test
  void validateRejectsAnonToken() throws Exception {
    String token =
        TestJwtFactory.buildToken(
            UUID.randomUUID(), "anon", false, "authenticated", TestJwtFactory.JWT_SECRET);

    assertThatThrownBy(() -> validator.validate(token))
        .isInstanceOf(UnauthenticatedException.class)
        .hasMessageContaining("not for an authenticated user");
  }

  @Test
  void validateRequiresJwtSecretForHs256() throws Exception {
    SupabaseJwtValidator secretlessValidator =
        new SupabaseJwtValidator(
            new AppProperties(
                "/api/v1",
                "http://localhost:5173",
                TestJwtFactory.SUPABASE_URL,
                "",
                "authenticated",
                "",
                false));
    String token = TestJwtFactory.buildToken(UUID.randomUUID());

    assertThatThrownBy(() -> secretlessValidator.validate(token))
        .isInstanceOf(UnauthenticatedException.class)
        .hasMessageContaining("Invalid or expired");
  }
}
