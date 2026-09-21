package com.housingplatform.persistence.repository;

import com.housingplatform.persistence.entity.Property;
import com.housingplatform.persistence.enums.PropertyStatus;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PropertyRepository extends JpaRepository<Property, UUID>, PropertyRepositoryCustom {

  @Query(
      """
      SELECT CASE WHEN COUNT(p) > 0 THEN true ELSE false END
      FROM Property p JOIN p.host h
      WHERE p.id = :propertyId AND p.deletedAt IS NULL
        AND h.profileId = :profileId AND h.deletedAt IS NULL
      """)
  boolean existsForHostProfile(
      @Param("profileId") UUID profileId, @Param("propertyId") UUID propertyId);

  Optional<Property> findByIdAndDeletedAtIsNullAndStatus(UUID id, PropertyStatus status);

  long countByHostIdAndDeletedAtIsNull(UUID hostId);
}
