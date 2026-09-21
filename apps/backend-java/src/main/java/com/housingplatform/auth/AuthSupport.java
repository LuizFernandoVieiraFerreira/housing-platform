package com.housingplatform.auth;

import com.housingplatform.auth.error.UnauthenticatedException;
import com.housingplatform.auth.model.AuthenticatedUser;
import java.util.Optional;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public final class AuthSupport {

  private AuthSupport() {}

  public static Optional<AuthenticatedUser> currentUserOptional() {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    if (authentication == null || !(authentication.getPrincipal() instanceof AuthenticatedUser user)) {
      return Optional.empty();
    }
    return Optional.of(user);
  }

  public static AuthenticatedUser requireCurrentUser() {
    return currentUserOptional()
        .orElseThrow(UnauthenticatedException::new);
  }
}
