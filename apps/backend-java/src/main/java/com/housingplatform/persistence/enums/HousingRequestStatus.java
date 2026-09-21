package com.housingplatform.persistence.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum HousingRequestStatus {
  NEW("new"),
  IN_PROGRESS("in_progress"),
  CLOSED("closed");

  private final String dbValue;

  HousingRequestStatus(String dbValue) {
    this.dbValue = dbValue;
  }

  @JsonValue
  public String dbValue() {
    return dbValue;
  }

  @JsonCreator
  public static HousingRequestStatus fromDbValue(String value) {
    for (HousingRequestStatus status : values()) {
      if (status.dbValue.equals(value)) {
        return status;
      }
    }
    throw new IllegalArgumentException("Unknown housing_request_status: " + value);
  }
}
