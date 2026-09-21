package com.housingplatform.authorization;

import static org.mockito.Mockito.when;

import com.housingplatform.shared.auth.model.AuthenticatedUser;
import com.housingplatform.shared.auth.support.TestJwtFactory;
import com.housingplatform.shared.auth.support.TestProfiles;
import com.housingplatform.persistence.enums.UserRole;
import com.housingplatform.persistence.repository.ProfileRepository;
import java.util.Optional;
import java.util.UUID;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

public final class AuthorizationMvcTestSupport {

  public static final String API = "/api/v1";

  private AuthorizationMvcTestSupport() {}

  public static AuthenticatedUser customer(UUID userId) {
    return new AuthenticatedUser(userId, "customer@example.com", UserRole.customer);
  }

  public static AuthenticatedUser host(UUID userId) {
    return new AuthenticatedUser(userId, "host@example.com", UserRole.host);
  }

  public static void stubAuthUser(ProfileRepository profileRepository, AuthenticatedUser user) {
    when(profileRepository.findActiveById(user.id()))
        .thenReturn(Optional.of(TestProfiles.active(user.id(), user.role())));
  }

  public static RequestPostProcessor bearerToken(AuthenticatedUser user) throws Exception {
    String token = TestJwtFactory.buildToken(user.id());
    return request -> {
      request.addHeader("Authorization", "Bearer " + token);
      return request;
    };
  }

  public static String hostPropertyPayload() {
    return """
        {
          "title": "Cozy Studio in Hongdae",
          "description": "A bright studio close to the subway with everything you need.",
          "propertyType": "studio",
          "addressLine1": "123 Test Street",
          "city": "Seoul",
          "district": "Mapo-gu",
          "bookingMode": "request",
          "minStayNights": 30
        }
        """;
  }
}
