package com.housingplatform.persistence.repository;

import com.housingplatform.persistence.entity.BookingPriceSnapshot;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BookingPriceSnapshotRepository
    extends JpaRepository<BookingPriceSnapshot, UUID> {}
