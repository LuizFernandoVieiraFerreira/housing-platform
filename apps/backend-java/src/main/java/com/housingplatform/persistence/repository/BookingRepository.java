package com.housingplatform.persistence.repository;

import com.housingplatform.persistence.entity.Booking;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BookingRepository extends JpaRepository<Booking, UUID> {

  @Query("SELECT b.propertyId FROM Booking b WHERE b.id = :id")
  Optional<UUID> findPropertyIdById(@Param("id") UUID id);
}
