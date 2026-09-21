package com.housingplatform.shared.auth.model;

import com.housingplatform.persistence.enums.UserRole;
import java.util.UUID;

public record AuthenticatedUser(UUID id, String email, UserRole role) {

  public boolean isAdmin() {
    return role == UserRole.admin;
  }
}
