package com.housingplatform.persistence.repository;

import com.housingplatform.persistence.entity.Profile;
import com.housingplatform.persistence.enums.UserRole;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProfileRepository extends JpaRepository<Profile, UUID> {

  @Query("SELECT p FROM Profile p WHERE p.id = :id AND p.deletedAt IS NULL")
  Optional<Profile> findActiveById(@Param("id") UUID id);

  @Query(
      """
      SELECT CASE WHEN COUNT(p) > 0 THEN true ELSE false END
      FROM Profile p
      WHERE p.id = :id AND p.role = :role AND p.deletedAt IS NULL
      """)
  boolean existsActiveByIdAndRole(@Param("id") UUID id, @Param("role") UserRole role);
}
