package com.housingplatform.persistence.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import java.util.UUID;

@Entity
@Table(name = "property_amenities", schema = "public")
@IdClass(PropertyAmenityId.class)
public class PropertyAmenity {

  @Id
  @Column(name = "property_id", nullable = false)
  private UUID propertyId;

  @Id
  @Column(name = "amenity_id", nullable = false)
  private UUID amenityId;

  protected PropertyAmenity() {}

  public UUID getPropertyId() {
    return propertyId;
  }

  public UUID getAmenityId() {
    return amenityId;
  }
}
