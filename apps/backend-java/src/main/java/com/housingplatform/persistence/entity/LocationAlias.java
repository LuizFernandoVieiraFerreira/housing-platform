package com.housingplatform.persistence.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "location_aliases", schema = "public")
public class LocationAlias {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  @Column(name = "id", nullable = false)
  private UUID id;

  @Column(name = "alias", nullable = false)
  private String alias;

  @Column(name = "district", nullable = false)
  private String district;

  @Column(name = "center_lat", nullable = false)
  private double centerLat;

  @Column(name = "center_lng", nullable = false)
  private double centerLng;

  @Column(name = "radius_meters", nullable = false)
  private int radiusMeters;

  @Column(name = "created_at", nullable = false)
  private OffsetDateTime createdAt;

  protected LocationAlias() {}

  public UUID getId() {
    return id;
  }

  public String getAlias() {
    return alias;
  }

  public String getDistrict() {
    return district;
  }

  public double getCenterLat() {
    return centerLat;
  }

  public double getCenterLng() {
    return centerLng;
  }

  public int getRadiusMeters() {
    return radiusMeters;
  }

  public OffsetDateTime getCreatedAt() {
    return createdAt;
  }
}
