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
@Table(name = "amenities", schema = "public")
public class Amenity {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  @Column(name = "id", nullable = false)
  private UUID id;

  @Column(name = "slug", nullable = false)
  private String slug;

  @Column(name = "name", nullable = false)
  private String name;

  @Column(name = "sort_order", nullable = false)
  private int sortOrder;

  @Column(name = "icon")
  private String icon;

  @Column(name = "created_at", nullable = false)
  private OffsetDateTime createdAt;

  protected Amenity() {}

  public UUID getId() {
    return id;
  }

  public String getSlug() {
    return slug;
  }

  public String getName() {
    return name;
  }

  public int getSortOrder() {
    return sortOrder;
  }

  public String getIcon() {
    return icon;
  }

  public OffsetDateTime getCreatedAt() {
    return createdAt;
  }
}
