package com.housingplatform.persistence.repository;

import com.housingplatform.persistence.entity.Payment;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentRepository extends JpaRepository<Payment, UUID>, PaymentRepositoryCustom {}
