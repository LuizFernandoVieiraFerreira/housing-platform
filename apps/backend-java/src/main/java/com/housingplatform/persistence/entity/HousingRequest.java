package com.housingplatform.persistence.entity;

import com.housingplatform.persistence.converter.AccommodationTypeConverter;
import com.housingplatform.persistence.converter.HousingRequestStatusConverter;
import com.housingplatform.persistence.enums.AccommodationType;
import com.housingplatform.persistence.enums.HousingRequestStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
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
@Entity
@Table(name = "housing_requests", schema = "public")
public class HousingRequest {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  @Column(name = "id", nullable = false)
  private UUID id;

  @Column(name = "email", nullable = false)
  private String email;

  @Column(name = "desired_area", nullable = false)
  private String desiredArea;

  @Convert(converter = HousingRequestStatusConverter.class)
  @Column(name = "status", nullable = false, columnDefinition = "housing_request_status")
  private HousingRequestStatus status;

  @Column(name = "customer_id", insertable = false, updatable = false)
  private UUID customerId;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "customer_id")
  private Profile customer;

  @Column(name = "check_in")
  private LocalDate checkIn;

  @Column(name = "check_out")
  private LocalDate checkOut;

  @Column(name = "budget_max")
  private Integer budgetMax;

  @Convert(converter = AccommodationTypeConverter.class)
  @Column(name = "accommodation_type", columnDefinition = "accommodation_type")
  private AccommodationType accommodationType;

  @Column(name = "notes")
  private String notes;

  @Column(name = "created_at", nullable = false)
  private OffsetDateTime createdAt;

  @Column(name = "updated_at", nullable = false)
  private OffsetDateTime updatedAt;

  protected HousingRequest() {}

  public UUID getId() {
    return id;
  }

  public String getEmail() {
    return email;
  }

  public String getDesiredArea() {
    return desiredArea;
  }

  public HousingRequestStatus getStatus() {
    return status;
  }

  public UUID getCustomerId() {
    return customerId;
  }

  public Profile getCustomer() {
    return customer;
  }

  public LocalDate getCheckIn() {
    return checkIn;
  }

  public LocalDate getCheckOut() {
    return checkOut;
  }

  public Integer getBudgetMax() {
    return budgetMax;
  }

  public AccommodationType getAccommodationType() {
    return accommodationType;
  }

  public String getNotes() {
    return notes;
  }

  public OffsetDateTime getCreatedAt() {
    return createdAt;
  }

  public OffsetDateTime getUpdatedAt() {
    return updatedAt;
  }
}
