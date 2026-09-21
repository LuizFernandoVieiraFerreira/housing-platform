package com.housingplatform.persistence.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "booking_price_snapshots", schema = "public")
public class BookingPriceSnapshot {

  @Id
  @Column(name = "booking_id", nullable = false)
  private UUID bookingId;

  @MapsId
  @OneToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "booking_id", nullable = false)
  private Booking booking;

  @Column(name = "rent_krw", nullable = false)
  private int rentKrw;

  @Column(name = "service_fee_krw", nullable = false)
  private int serviceFeeKrw;

  @Column(name = "utilities_krw", nullable = false)
  private int utilitiesKrw;

  @Column(name = "total_krw", nullable = false)
  private int totalKrw;

  @Column(name = "pricing_version", nullable = false)
  private String pricingVersion;

  @JdbcTypeCode(SqlTypes.JSON)
  @Column(name = "nightly_breakdown", nullable = false, columnDefinition = "jsonb")
  private List<Map<String, Object>> nightlyBreakdown;

  @Column(name = "created_at", nullable = false)
  private OffsetDateTime createdAt;

  protected BookingPriceSnapshot() {}

  public UUID getBookingId() {
    return bookingId;
  }

  public Booking getBooking() {
    return booking;
  }

  public int getRentKrw() {
    return rentKrw;
  }

  public int getServiceFeeKrw() {
    return serviceFeeKrw;
  }

  public int getUtilitiesKrw() {
    return utilitiesKrw;
  }

  public int getTotalKrw() {
    return totalKrw;
  }

  public String getPricingVersion() {
    return pricingVersion;
  }

  public List<Map<String, Object>> getNightlyBreakdown() {
    return nightlyBreakdown;
  }

  public OffsetDateTime getCreatedAt() {
    return createdAt;
  }
}
