package com.housingplatform.authorization;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
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
import com.housingplatform.persistence.entity.Property;
import com.housingplatform.persistence.enums.PropertyStatus;
import com.housingplatform.properties.PropertyController;
import com.housingplatform.persistence.repository.PropertyRepository;
import com.housingplatform.properties.PropertyService;
import com.housingplatform.shared.StorageUrlResolver;
import java.util.List;
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
    controllers = PropertyController.class,
    excludeAutoConfiguration = {
      DataSourceAutoConfiguration.class,
      HibernateJpaAutoConfiguration.class
    })
@Import({
  PropertyService.class,
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
class PropertyAuthorizationTest {

  @Autowired private MockMvc mockMvc;

  @MockitoBean private PropertyRepository propertyRepository;

  @MockitoBean private com.housingplatform.persistence.repository.ProfileRepository profileRepository;

  @MockitoBean private com.housingplatform.persistence.repository.HostRepository hostRepository;

  @MockitoBean private com.housingplatform.persistence.repository.BookingRepository bookingRepository;

  @MockitoBean private StorageUrlResolver storageUrlResolver;

  private UUID customerId;
  private UUID hostId;
  private AuthenticatedUser customer;
  private AuthenticatedUser host;

  @BeforeEach
  void setUp() throws Exception {
    customerId = UUID.randomUUID();
    hostId = UUID.randomUUID();
    customer = AuthorizationMvcTestSupport.customer(customerId);
    host = AuthorizationMvcTestSupport.host(hostId);
  }

  @Test
  void draftPropertyIsNotFoundOnPublicRoute() throws Exception {
    UUID propertyId = UUID.randomUUID();
    when(propertyRepository.findPublishedProperty(propertyId)).thenReturn(Optional.empty());

    mockMvc
        .perform(get(AuthorizationMvcTestSupport.API + "/properties/" + propertyId))
        .andExpect(status().isNotFound())
        .andExpect(jsonPath("$.error.code").value("NOT_FOUND"));
  }

  @Test
  void searchDelegatesToRepositoryWithoutAuth() throws Exception {
    when(propertyRepository.search(any(), eq(20), eq(0))).thenReturn(List.of());

    mockMvc
        .perform(get(AuthorizationMvcTestSupport.API + "/properties"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.items").isArray())
        .andExpect(jsonPath("$.totalCount").value(0));
  }

  @Test
  void customerCannotUpdateProperty() throws Exception {
    UUID propertyId = UUID.randomUUID();
    Property property = mock(Property.class);
    when(property.getStatus()).thenReturn(PropertyStatus.draft);
    when(propertyRepository.findHostProperty(propertyId)).thenReturn(Optional.of(property));
    when(profileRepository.existsActiveByIdAndRole(customerId, com.housingplatform.persistence.enums.UserRole.admin))
        .thenReturn(false);
    when(propertyRepository.existsForHostProfile(customerId, propertyId)).thenReturn(false);
    AuthorizationMvcTestSupport.stubAuthUser(profileRepository, customer);

    mockMvc
        .perform(
            patch(AuthorizationMvcTestSupport.API + "/properties/" + propertyId)
                .with(AuthorizationMvcTestSupport.bearerToken(customer))
                .contentType(MediaType.APPLICATION_JSON)
                .content(AuthorizationMvcTestSupport.hostPropertyPayload()))
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.error.code").value("FORBIDDEN"));
  }

  @Test
  void customerCannotSetPropertyLocation() throws Exception {
    UUID propertyId = UUID.randomUUID();
    Property property = mock(Property.class);
    when(property.getStatus()).thenReturn(PropertyStatus.draft);
    when(propertyRepository.findHostProperty(propertyId)).thenReturn(Optional.of(property));
    when(profileRepository.existsActiveByIdAndRole(customerId, com.housingplatform.persistence.enums.UserRole.admin))
        .thenReturn(false);
    when(propertyRepository.existsForHostProfile(customerId, propertyId)).thenReturn(false);
    AuthorizationMvcTestSupport.stubAuthUser(profileRepository, customer);

    mockMvc
        .perform(
            post(AuthorizationMvcTestSupport.API + "/properties/" + propertyId + "/location")
                .with(AuthorizationMvcTestSupport.bearerToken(customer))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"latitude\":37.55,\"longitude\":126.92}"))
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.error.code").value("FORBIDDEN"));
  }

  @Test
  void customerCannotSubmitPropertyForReview() throws Exception {
    UUID propertyId = UUID.randomUUID();
    when(propertyRepository.existsForHostProfile(customerId, propertyId)).thenReturn(false);
    AuthorizationMvcTestSupport.stubAuthUser(profileRepository, customer);

    mockMvc
        .perform(
            post(AuthorizationMvcTestSupport.API + "/properties/" + propertyId + "/submit-review")
                .with(AuthorizationMvcTestSupport.bearerToken(customer)))
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.error.code").value("FORBIDDEN"));
  }

  @Test
  void hostCannotUpdatePublishedProperty() throws Exception {
    UUID propertyId = UUID.randomUUID();
    Property property = mock(Property.class);
    when(property.getStatus()).thenReturn(PropertyStatus.published);
    when(propertyRepository.findHostProperty(propertyId)).thenReturn(Optional.of(property));
    when(profileRepository.existsActiveByIdAndRole(hostId, com.housingplatform.persistence.enums.UserRole.admin))
        .thenReturn(false);
    when(propertyRepository.existsForHostProfile(hostId, propertyId)).thenReturn(true);
    AuthorizationMvcTestSupport.stubAuthUser(profileRepository, host);

    mockMvc
        .perform(
            patch(AuthorizationMvcTestSupport.API + "/properties/" + propertyId)
                .with(AuthorizationMvcTestSupport.bearerToken(host))
                .contentType(MediaType.APPLICATION_JSON)
                .content(AuthorizationMvcTestSupport.hostPropertyPayload()))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"));
  }
}
