package com.sanoli.fitradar.dto;

import com.sanoli.fitradar.domain.Program;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record ProgramResponse(
        UUID id,
        UUID creatorId,
        String title,
        String description,
        boolean active,
        BigDecimal price,
        boolean paid,
        long workoutCount,
        boolean nutritionStructured,
        Instant createdAt
) {
    public static ProgramResponse fromEntity(Program program, long workoutCount) {
        return new ProgramResponse(
                program.getId(),
                program.getCreatorId(),
                program.getTitle(),
                program.getDescription(),
                program.isActive(),
                program.getPrice(),
                program.isPaid(),
                workoutCount,
                program.isNutritionStructured(),
                program.getCreatedAt()
        );
    }
}
