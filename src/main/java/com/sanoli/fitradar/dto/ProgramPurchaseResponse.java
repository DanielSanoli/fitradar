package com.sanoli.fitradar.dto;

import com.sanoli.fitradar.domain.ProgramPurchase;
import com.sanoli.fitradar.domain.PurchaseStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record ProgramPurchaseResponse(
        UUID id,
        UUID programId,
        String programTitle,
        UUID studentId,
        String studentName,
        BigDecimal amount,
        BigDecimal platformFee,
        BigDecimal creatorNet,
        PurchaseStatus status,
        Instant createdAt,
        Instant confirmedAt
) {
    public static ProgramPurchaseResponse fromEntity(
            ProgramPurchase purchase,
            String programTitle,
            String studentName
    ) {
        return new ProgramPurchaseResponse(
                purchase.getId(),
                purchase.getProgramId(),
                programTitle,
                purchase.getStudentId(),
                studentName,
                purchase.getAmount(),
                purchase.getPlatformFee(),
                purchase.getCreatorNet(),
                purchase.getStatus(),
                purchase.getCreatedAt(),
                purchase.getConfirmedAt()
        );
    }
}
