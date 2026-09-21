package com.housingplatform.persistence.repository;

import com.housingplatform.persistence.entity.Payment;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PaymentRepository extends JpaRepository<Payment, UUID>, PaymentRepositoryCustom {

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("SELECT p FROM Payment p WHERE p.orderId = :orderId")
  Optional<Payment> findByOrderIdForUpdate(@Param("orderId") UUID orderId);
}
