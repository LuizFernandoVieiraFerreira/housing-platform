package com.housingplatform.persistence.entity;

import java.io.Serializable;
import java.time.OffsetDateTime;
import java.util.Objects;

public class ApiRateLimitId implements Serializable {

  private String bucket;
  private OffsetDateTime windowStart;

  protected ApiRateLimitId() {}

  public ApiRateLimitId(String bucket, OffsetDateTime windowStart) {
    this.bucket = bucket;
    this.windowStart = windowStart;
  }

  public String getBucket() {
    return bucket;
  }

  public OffsetDateTime getWindowStart() {
    return windowStart;
  }

  @Override
  public boolean equals(Object other) {
    if (this == other) {
      return true;
    }
    if (!(other instanceof ApiRateLimitId that)) {
      return false;
    }
    return Objects.equals(bucket, that.bucket)
        && Objects.equals(windowStart, that.windowStart);
  }

  @Override
  public int hashCode() {
    return Objects.hash(bucket, windowStart);
  }
}
