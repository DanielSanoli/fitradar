package com.sanoli.fitradar.repository;

import com.sanoli.fitradar.domain.ProgramPurchase;
import com.sanoli.fitradar.domain.PurchaseStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProgramPurchaseRepository extends JpaRepository<ProgramPurchase, UUID> {

    Optional<ProgramPurchase> findByIdAndStudentId(UUID id, UUID studentId);

    Optional<ProgramPurchase> findByAsaasPaymentId(String asaasPaymentId);

    List<ProgramPurchase> findByCreatorIdOrderByCreatedAtDesc(UUID creatorId);

    boolean existsByStudentIdAndProgramIdAndStatus(UUID studentId, UUID programId, PurchaseStatus status);
}
