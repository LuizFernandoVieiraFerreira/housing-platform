package com.housingplatform.persistence.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;

@Entity
@Table(name = "platform_settings", schema = "public")
public class PlatformSetting {

  @Id
  @Column(name = "id", nullable = false)
  private short id;

  @Column(name = "service_fee_bps", nullable = false)
  private int serviceFeeBps;

  @Column(name = "hold_ttl_minutes", nullable = false)
  private int holdTtlMinutes;

  @Column(name = "pricing_version", nullable = false)
  private String pricingVersion;

  @Column(name = "updated_at", nullable = false)
  private OffsetDateTime updatedAt;

  protected PlatformSetting() {}

  public short getId() {
    return id;
  }

  public int getServiceFeeBps() {
    return serviceFeeBps;
  }

  public int getHoldTtlMinutes() {
    return holdTtlMinutes;
  }

  public String getPricingVersion() {
    return pricingVersion;
  }

  public OffsetDateTime getUpdatedAt() {
    return updatedAt;
  }
}
