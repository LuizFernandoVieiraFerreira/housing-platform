package com.housingplatform.persistence.entity;

import com.housingplatform.persistence.converter.AccommodationTypeConverter;
import com.housingplatform.persistence.enums.AccommodationType;
import com.housingplatform.persistence.enums.BookingMode;
import com.housingplatform.persistence.enums.PropertyEmbeddingSyncStatus;
import com.housingplatform.persistence.enums.PropertyStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
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
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.locationtech.jts.geom.Point;

@Entity
@Table(name = "properties", schema = "public")
public class Property {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  @Column(name = "id", nullable = false)
  private UUID id;

  @Column(name = "host_id", nullable = false, insertable = false, updatable = false)
  private UUID hostId;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "host_id", nullable = false)
  private Host host;

  @Column(name = "title", nullable = false)
  private String title;

  @Column(name = "slug", nullable = false)
  private String slug;

  @Column(name = "description", nullable = false)
  private String description;

  @Convert(converter = AccommodationTypeConverter.class)
  @Column(name = "property_type", nullable = false, columnDefinition = "accommodation_type")
  private AccommodationType propertyType;

  @Column(name = "address_line1", nullable = false)
  private String addressLine1;

  @Column(name = "address_line2")
  private String addressLine2;

  @Column(name = "city", nullable = false)
  private String city;

  @Column(name = "country", nullable = false)
  private String country;

  @Column(name = "postal_code")
  private String postalCode;

  @Column(name = "district", nullable = false)
  private String district;

  @JdbcTypeCode(SqlTypes.GEOMETRY)
  @Column(name = "location", columnDefinition = "geography(Point,4326)")
  private Point location;

  @Column(name = "nearest_station_name")
  private String nearestStationName;

  @Column(name = "nearest_station_walk_min")
  private Integer nearestStationWalkMin;

  @Enumerated(EnumType.STRING)
  @JdbcTypeCode(SqlTypes.NAMED_ENUM)
  @Column(name = "status", nullable = false, columnDefinition = "property_status")
  private PropertyStatus status;

  @Enumerated(EnumType.STRING)
  @JdbcTypeCode(SqlTypes.NAMED_ENUM)
  @Column(name = "booking_mode", nullable = false, columnDefinition = "booking_mode")
  private BookingMode bookingMode;

  @Column(name = "min_stay_nights", nullable = false)
  private int minStayNights;

  @Column(name = "monthly_price_min")
  private Integer monthlyPriceMin;

  @Column(name = "is_featured", nullable = false)
  private boolean featured;

  @JdbcTypeCode(SqlTypes.ARRAY)
  @Column(name = "tags", nullable = false, columnDefinition = "text[]")
  private String[] tags;

  @Column(name = "published_at")
  private OffsetDateTime publishedAt;

  @Column(name = "deleted_at")
  private OffsetDateTime deletedAt;

  @Column(name = "created_at", nullable = false)
  private OffsetDateTime createdAt;

  @Column(name = "updated_at", nullable = false)
  private OffsetDateTime updatedAt;

  @Enumerated(EnumType.STRING)
  @JdbcTypeCode(SqlTypes.NAMED_ENUM)
  @Column(name = "embedding_sync_status", columnDefinition = "property_embedding_sync_status")
  private PropertyEmbeddingSyncStatus embeddingSyncStatus;

  @Column(name = "embedding_sync_requested_at")
  private OffsetDateTime embeddingSyncRequestedAt;

  @Column(name = "embedding_synced_at")
  private OffsetDateTime embeddingSyncedAt;

  @Column(name = "embedding_sync_attempts", nullable = false)
  private int embeddingSyncAttempts;

  @Column(name = "embedding_sync_error")
  private String embeddingSyncError;

  protected Property() {}

  public UUID getId() {
    return id;
  }

  public UUID getHostId() {
    return hostId;
  }

  public Host getHost() {
    return host;
  }

  public String getTitle() {
    return title;
  }

  public String getSlug() {
    return slug;
  }

  public String getDescription() {
    return description;
  }

  public AccommodationType getPropertyType() {
    return propertyType;
  }

  public String getAddressLine1() {
    return addressLine1;
  }

  public String getAddressLine2() {
    return addressLine2;
  }

  public String getCity() {
    return city;
  }

  public String getCountry() {
    return country;
  }

  public String getPostalCode() {
    return postalCode;
  }

  public String getDistrict() {
    return district;
  }

  public Point getLocation() {
    return location;
  }

  public String getNearestStationName() {
    return nearestStationName;
  }

  public Integer getNearestStationWalkMin() {
    return nearestStationWalkMin;
  }

  public PropertyStatus getStatus() {
    return status;
  }

  public BookingMode getBookingMode() {
    return bookingMode;
  }

  public int getMinStayNights() {
    return minStayNights;
  }

  public Integer getMonthlyPriceMin() {
    return monthlyPriceMin;
  }

  public boolean isFeatured() {
    return featured;
  }

  public String[] getTags() {
    return tags;
  }

  public OffsetDateTime getPublishedAt() {
    return publishedAt;
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

  public PropertyEmbeddingSyncStatus getEmbeddingSyncStatus() {
    return embeddingSyncStatus;
  }

  public OffsetDateTime getEmbeddingSyncRequestedAt() {
    return embeddingSyncRequestedAt;
  }

  public OffsetDateTime getEmbeddingSyncedAt() {
    return embeddingSyncedAt;
  }

  public int getEmbeddingSyncAttempts() {
    return embeddingSyncAttempts;
  }

  public String getEmbeddingSyncError() {
    return embeddingSyncError;
  }
}
