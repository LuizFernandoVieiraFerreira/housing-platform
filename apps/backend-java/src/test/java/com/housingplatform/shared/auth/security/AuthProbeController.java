package com.housingplatform.shared.auth.security;

import com.housingplatform.shared.auth.AuthSupport;
import com.housingplatform.shared.auth.model.AuthenticatedUser;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("${housing-platform.api-prefix}")
class AuthProbeController {

  @GetMapping("/protected")
  Map<String, String> protectedRoute() {
    AuthenticatedUser user = AuthSupport.requireCurrentUser();
    return Map.of("userId", user.id().toString(), "role", user.role().name());
  }

  @GetMapping("/optional")
  Map<String, String> optionalRoute() {
    String userId =
        AuthSupport.currentUserOptional().map(user -> user.id().toString()).orElse("");
    return Map.of("userId", userId);
  }
}
