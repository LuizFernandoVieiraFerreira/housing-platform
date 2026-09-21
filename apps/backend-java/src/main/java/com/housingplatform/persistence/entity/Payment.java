package com.housingplatform.persistence.entity;

import com.housingplatform.persistence.enums.PaymentStatus;
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
import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "payments", schema = "public")
public class Payment {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  @Column(name = "id", nullable = false)
  private UUID id;

  @Column(name = "order_id", nullable = false)
  private UUID orderId;

  @Column(name = "booking_id", nullable = false, insertable = false, updatable = false)
  private UUID bookingId;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "booking_id", nullable = false)
  private Booking booking;

  @Column(name = "customer_id", nullable = false, insertable = false, updatable = false)
  private UUID customerId;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "customer_id", nullable = false)
  private Profile customer;

  @Column(name = "amount_krw", nullable = false)
  private int amountKrw;

  @Enumerated(EnumType.STRING)
  @JdbcTypeCode(SqlTypes.NAMED_ENUM)
  @Column(name = "status", nullable = false, columnDefinition = "payment_status")
  private PaymentStatus status;

  @Column(name = "payment_key")
  private String paymentKey;

  @JdbcTypeCode(SqlTypes.JSON)
  @Column(name = "toss_response", columnDefinition = "jsonb")
  private Map<String, Object> tossResponse;

  @Column(name = "failed_reason")
  private String failedReason;

  @Column(name = "confirmed_at")
  private OffsetDateTime confirmedAt;

  @Column(name = "created_at", nullable = false)
  private OffsetDateTime createdAt;

  @Column(name = "updated_at", nullable = false)
  private OffsetDateTime updatedAt;

  protected Payment() {}

  public UUID getId() {
    return id;
  }

  public UUID getOrderId() {
    return orderId;
  }

  public UUID getBookingId() {
    return bookingId;
  }

  public Booking getBooking() {
    return booking;
  }

  public UUID getCustomerId() {
    return customerId;
  }

  public Profile getCustomer() {
    return customer;
  }

  public int getAmountKrw() {
    return amountKrw;
  }

  public PaymentStatus getStatus() {
    return status;
  }

  public String getPaymentKey() {
    return paymentKey;
  }

  public Map<String, Object> getTossResponse() {
    return tossResponse;
  }

  public String getFailedReason() {
    return failedReason;
  }

  public OffsetDateTime getConfirmedAt() {
    return confirmedAt;
  }

  public OffsetDateTime getCreatedAt() {
    return createdAt;
  }

  public OffsetDateTime getUpdatedAt() {
    return updatedAt;
  }
}
