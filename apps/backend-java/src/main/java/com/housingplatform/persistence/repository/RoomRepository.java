package com.housingplatform.persistence.repository;

import com.housingplatform.persistence.entity.Room;
import com.housingplatform.persistence.enums.RoomStatus;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoomRepository extends JpaRepository<Room, UUID> {

  Optional<Room> findByIdAndDeletedAtIsNullAndStatus(UUID id, RoomStatus status);
}
