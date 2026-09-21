package com.housingplatform.persistence.entity;

import com.housingplatform.persistence.enums.BookingStatus;
import com.housingplatform.persistence.enums.BookingType;
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
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "bookings", schema = "public")
public class Booking {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  @Column(name = "id", nullable = false)
  private UUID id;

  @Column(name = "customer_id", nullable = false, insertable = false, updatable = false)
  private UUID customerId;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "customer_id", nullable = false)
  private Profile customer;

  @Column(name = "room_id", nullable = false, insertable = false, updatable = false)
  private UUID roomId;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "room_id", nullable = false)
  private Room room;

  @Column(name = "property_id", nullable = false, insertable = false, updatable = false)
  private UUID propertyId;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "property_id", nullable = false)
  private Property property;

  @Column(name = "check_in", nullable = false)
  private LocalDate checkIn;

  @Column(name = "check_out", nullable = false)
  private LocalDate checkOut;

  @Column(name = "guest_count", nullable = false)
  private int guestCount;

  @Enumerated(EnumType.STRING)
  @JdbcTypeCode(SqlTypes.NAMED_ENUM)
  @Column(name = "status", nullable = false, columnDefinition = "booking_status")
  private BookingStatus status;

  @Enumerated(EnumType.STRING)
  @JdbcTypeCode(SqlTypes.NAMED_ENUM)
  @Column(name = "booking_type", nullable = false, columnDefinition = "booking_type")
  private BookingType bookingType;

  @Column(name = "hold_expires_at")
  private OffsetDateTime holdExpiresAt;

  @Column(name = "customer_notes")
  private String customerNotes;

  @Column(name = "approved_at")
  private OffsetDateTime approvedAt;

  @Column(name = "approved_by", insertable = false, updatable = false)
  private UUID approvedById;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "approved_by")
  private Profile approvedBy;

  @Column(name = "cancelled_at")
  private OffsetDateTime cancelledAt;

  @Column(name = "payment_retry_count", nullable = false)
  private int paymentRetryCount;

  @Column(name = "created_at", nullable = false)
  private OffsetDateTime createdAt;

  @Column(name = "updated_at", nullable = false)
  private OffsetDateTime updatedAt;

  protected Booking() {}

  public UUID getId() {
    return id;
  }

  public UUID getCustomerId() {
    return customerId;
  }

  public Profile getCustomer() {
    return customer;
  }

  public UUID getRoomId() {
    return roomId;
  }

  public Room getRoom() {
    return room;
  }

  public UUID getPropertyId() {
    return propertyId;
  }

  public Property getProperty() {
    return property;
  }

  public LocalDate getCheckIn() {
    return checkIn;
  }

  public LocalDate getCheckOut() {
    return checkOut;
  }

  public int getGuestCount() {
    return guestCount;
  }

  public BookingStatus getStatus() {
    return status;
  }

  public BookingType getBookingType() {
    return bookingType;
  }

  public OffsetDateTime getHoldExpiresAt() {
    return holdExpiresAt;
  }

  public String getCustomerNotes() {
    return customerNotes;
  }

  public OffsetDateTime getApprovedAt() {
    return approvedAt;
  }

  public UUID getApprovedById() {
    return approvedById;
  }

  public Profile getApprovedBy() {
    return approvedBy;
  }

  public OffsetDateTime getCancelledAt() {
    return cancelledAt;
  }

  public int getPaymentRetryCount() {
    return paymentRetryCount;
  }

  public OffsetDateTime getCreatedAt() {
    return createdAt;
  }

  public OffsetDateTime getUpdatedAt() {
    return updatedAt;
  }
}
