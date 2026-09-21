package com.housingplatform.persistence.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum AccommodationType {
  SHARE_HOUSE("share-house"),
  STUDIO("studio"),
  MICRO_STUDIO("micro-studio"),
  MULTI_BEDROOM("multi-bedroom");

  private final String dbValue;

  AccommodationType(String dbValue) {
    this.dbValue = dbValue;
  }

  @JsonValue
  public String dbValue() {
    return dbValue;
  }

  @JsonCreator
  public static AccommodationType fromDbValue(String value) {
    for (AccommodationType type : values()) {
      if (type.dbValue.equals(value)) {
        return type;
      }
    }
    throw new IllegalArgumentException("Unknown accommodation_type: " + value);
  }
}
