package com.housingplatform.auth.support;

import com.housingplatform.persistence.entity.Profile;
import com.housingplatform.persistence.enums.UserRole;
import java.lang.reflect.Constructor;
import java.util.UUID;

public final class TestProfiles {

  private TestProfiles() {}

  public static Profile active(UUID profileId, UserRole role) {
    try {
      Constructor<Profile> constructor = Profile.class.getDeclaredConstructor();
      constructor.setAccessible(true);
      Profile profile = constructor.newInstance();
      setField(profile, "id", profileId);
      setField(profile, "role", role);
      return profile;
    } catch (ReflectiveOperationException exception) {
      throw new IllegalStateException("Unable to create test profile", exception);
    }
  }

  private static void setField(Object target, String fieldName, Object value)
      throws ReflectiveOperationException {
    var field = Profile.class.getDeclaredField(fieldName);
    field.setAccessible(true);
    field.set(target, value);
  }
}
