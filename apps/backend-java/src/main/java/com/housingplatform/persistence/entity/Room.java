package com.housingplatform.persistence.entity;

import com.housingplatform.persistence.enums.RoomStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "rooms", schema = "public")
public class Room {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  @Column(name = "id", nullable = false)
  private UUID id;

  @Column(name = "property_id", nullable = false, insertable = false, updatable = false)
  private UUID propertyId;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "property_id", nullable = false)
  private Property property;

  @Column(name = "name", nullable = false)
  private String name;

  @Column(name = "room_type")
  private String roomType;

  @Column(name = "size_sqm")
  private BigDecimal sizeSqm;

  @Column(name = "max_occupancy", nullable = false)
  private int maxOccupancy;

  @Column(name = "monthly_price_krw", nullable = false)
  private int monthlyPriceKrw;

  @Enumerated(EnumType.STRING)
  @JdbcTypeCode(SqlTypes.NAMED_ENUM)
  @Column(name = "status", nullable = false, columnDefinition = "room_status")
  private RoomStatus status;

  @Column(name = "available_from")
  private LocalDate availableFrom;

  @Column(name = "deleted_at")
  private OffsetDateTime deletedAt;

  @Column(name = "created_at", nullable = false)
  private OffsetDateTime createdAt;

  @Column(name = "updated_at", nullable = false)
  private OffsetDateTime updatedAt;

  protected Room() {}

  public UUID getId() {
    return id;
  }

  public UUID getPropertyId() {
    return propertyId;
  }

  public Property getProperty() {
    return property;
  }

  public String getName() {
    return name;
  }

  public String getRoomType() {
    return roomType;
  }

  public BigDecimal getSizeSqm() {
    return sizeSqm;
  }

  public int getMaxOccupancy() {
    return maxOccupancy;
  }

  public int getMonthlyPriceKrw() {
    return monthlyPriceKrw;
  }

  public RoomStatus getStatus() {
    return status;
  }

  public LocalDate getAvailableFrom() {
    return availableFrom;
  }

  public OffsetDateTime getDeletedAt() {
    return deletedAt;
  }

  public OffsetDateTime getCreatedAt() {
    return createdAt;
  }

  public OffsetDateTime getUpdatedAt() {
    return updatedAt;
  }
}
