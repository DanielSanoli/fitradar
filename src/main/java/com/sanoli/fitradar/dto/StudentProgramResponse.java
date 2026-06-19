package com.sanoli.fitradar.dto;

import com.sanoli.fitradar.domain.Program;

import java.math.BigDecimal;
import java.util.UUID;

public record StudentProgramResponse(
        UUID id,
        String title,
        String description,
        BigDecimal price,
        boolean paid,
        boolean enrolled,
        boolean purchasePending
) {
    public static StudentProgramResponse fromEntity(
            Program program,
            boolean enrolled,
            boolean purchasePending
    ) {
        return new StudentProgramResponse(
                program.getId(),
                program.getTitle(),
                program.getDescription(),
                program.getPrice(),
                program.isPaid(),
                enrolled,
                purchasePending
        );
    }
}
