package com.housingplatform.persistence.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;

@Entity
@Table(name = "api_rate_limits", schema = "public")
@IdClass(ApiRateLimitId.class)
public class ApiRateLimit {

  @Id
  @Column(name = "bucket", nullable = false)
  private String bucket;

  @Id
  @Column(name = "window_start", nullable = false)
  private OffsetDateTime windowStart;

  @Column(name = "request_count", nullable = false)
  private int requestCount;

  protected ApiRateLimit() {}

  public String getBucket() {
    return bucket;
  }

  public OffsetDateTime getWindowStart() {
    return windowStart;
  }

  public int getRequestCount() {
    return requestCount;
  }
}
