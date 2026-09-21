package com.housingplatform.persistence.repository;

import com.housingplatform.persistence.entity.PaymentEvent;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentEventRepository extends JpaRepository<PaymentEvent, UUID> {

  boolean existsByEventId(String eventId);
}
