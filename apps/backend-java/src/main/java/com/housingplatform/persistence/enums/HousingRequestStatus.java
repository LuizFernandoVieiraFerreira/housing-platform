package com.housingplatform.persistence.enums;

public enum HousingRequestStatus {
  NEW("new"),
  IN_PROGRESS("in_progress"),
  CLOSED("closed");

  private final String dbValue;

  HousingRequestStatus(String dbValue) {
    this.dbValue = dbValue;
  }

  public String dbValue() {
    return dbValue;
  }

  public static HousingRequestStatus fromDbValue(String value) {
    for (HousingRequestStatus status : values()) {
      if (status.dbValue.equals(value)) {
        return status;
      }
    }
    throw new IllegalArgumentException("Unknown housing_request_status: " + value);
  }
}
