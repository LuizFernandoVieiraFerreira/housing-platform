package com.housingplatform.persistence.entity;

import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

public class PropertyAmenityId implements Serializable {

  private UUID propertyId;
  private UUID amenityId;

  protected PropertyAmenityId() {}

  public PropertyAmenityId(UUID propertyId, UUID amenityId) {
    this.propertyId = propertyId;
    this.amenityId = amenityId;
  }

  public UUID getPropertyId() {
    return propertyId;
  }

  public UUID getAmenityId() {
    return amenityId;
  }

  @Override
  public boolean equals(Object other) {
    if (this == other) {
      return true;
    }
    if (!(other instanceof PropertyAmenityId that)) {
      return false;
    }
    return Objects.equals(propertyId, that.propertyId)
        && Objects.equals(amenityId, that.amenityId);
  }

  @Override
  public int hashCode() {
    return Objects.hash(propertyId, amenityId);
  }
}
