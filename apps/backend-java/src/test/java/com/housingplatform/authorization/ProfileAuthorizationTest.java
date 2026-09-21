package com.housingplatform.authorization;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.housingplatform.api.error.GlobalExceptionHandler;
import com.housingplatform.auth.jwt.SupabaseJwtValidator;
import com.housingplatform.auth.model.AuthenticatedUser;
import com.housingplatform.auth.security.SecurityConfig;
import com.housingplatform.auth.security.SupabaseJwtAuthenticationFilter;
import com.housingplatform.auth.support.TestJwtFactory;
import com.housingplatform.auth.support.TestProfiles;
import com.housingplatform.config.AppProperties;
import com.housingplatform.persistence.enums.UserRole;
import com.housingplatform.profile.ProfileController;
import com.housingplatform.profile.ProfileRepository;
import com.housingplatform.profile.ProfileService;
import com.housingplatform.profile.dto.UpdateProfileRequest;
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
    controllers = ProfileController.class,
    excludeAutoConfiguration = {
      DataSourceAutoConfiguration.class,
      HibernateJpaAutoConfiguration.class
    })
@Import({
  ProfileService.class,
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
class ProfileAuthorizationTest {

  @Autowired private MockMvc mockMvc;

  @MockitoBean private ProfileRepository profileRepository;

  @MockitoBean private com.housingplatform.persistence.repository.ProfileRepository authProfileRepository;

  @MockitoBean private com.housingplatform.persistence.repository.HostRepository hostRepository;

  @MockitoBean private com.housingplatform.persistence.repository.PropertyRepository propertyRepository;

  @MockitoBean private com.housingplatform.persistence.repository.BookingRepository bookingRepository;

  private UUID customerId;
  private AuthenticatedUser customer;

  @BeforeEach
  void setUp() throws Exception {
    customerId = UUID.randomUUID();
    customer = AuthorizationMvcTestSupport.customer(customerId);
    AuthorizationMvcTestSupport.stubAuthUser(authProfileRepository, customer);
  }

  @Test
  void updateProfileRequestDoesNotAcceptRole() {
    assertThat(UpdateProfileRequest.class.getRecordComponents())
        .extracting(java.lang.reflect.RecordComponent::getName)
        .doesNotContain("role");
  }

  @Test
  void updateProfileKeepsExistingRole() throws Exception {
    when(profileRepository.update(
            eq(customerId),
            eq("Jane Smith"),
            eq(null),
            eq("en"),
            eq(true),
            eq(null)))
        .thenReturn(TestProfiles.active(customerId, UserRole.customer));

    mockMvc
        .perform(
            patch(AuthorizationMvcTestSupport.API + "/profile")
                .with(AuthorizationMvcTestSupport.bearerToken(customer))
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {
                      "fullName": "Jane Smith",
                      "preferredLanguage": "en",
                      "marketingConsent": true
                    }
                    """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.role").value("customer"));

    verify(profileRepository)
        .update(eq(customerId), eq("Jane Smith"), eq(null), eq("en"), eq(true), eq(null));
  }
}
