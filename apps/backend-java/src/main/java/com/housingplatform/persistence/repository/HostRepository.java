package com.housingplatform.persistence.repository;

import com.housingplatform.persistence.entity.Host;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface HostRepository extends JpaRepository<Host, UUID>, HostRepositoryCustom {

  @Query(
      """
      SELECT h.id FROM Host h
      WHERE h.profileId = :profileId AND h.deletedAt IS NULL
      """)
  Optional<UUID> findHostIdByProfileId(@Param("profileId") UUID profileId);
}
