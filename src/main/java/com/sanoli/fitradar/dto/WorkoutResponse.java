package com.sanoli.fitradar.dto;

import com.sanoli.fitradar.domain.Workout;

import java.time.Instant;
import java.util.UUID;

public record WorkoutResponse(
        UUID id,
        UUID programId,
        String title,
        String description,
        String contentMarkdown,
        int dayIndex,
        Instant createdAt
) {
    public static WorkoutResponse fromEntity(Workout workout) {
        return new WorkoutResponse(
                workout.getId(),
                workout.getProgramId(),
                workout.getTitle(),
                workout.getDescription(),
                workout.getContentMarkdown(),
                workout.getDayIndex(),
                workout.getCreatedAt()
        );
    }
}
