package com.sanoli.fitradar.dto;

import com.sanoli.fitradar.domain.CheckIn;
import com.sanoli.fitradar.domain.CheckInStatus;

import java.time.LocalDate;
import java.util.UUID;

public record CheckInResponse(
        UUID id,
        UUID studentId,
        UUID workoutId,
        LocalDate date,
        CheckInStatus status,
        Integer feeling,
        String notes,
        int streakShields,
        int shieldEarnProgress,
        boolean shieldEarned,
        boolean shieldConsumed
) {
    public static CheckInResponse fromEntity(CheckIn checkIn) {
        return new CheckInResponse(
                checkIn.getId(),
                checkIn.getStudentId(),
                checkIn.getWorkoutId(),
                checkIn.getDate(),
                checkIn.getStatus(),
                checkIn.getFeeling(),
                checkIn.getNotes(),
                0,
                0,
                false,
                false
        );
    }

    public static CheckInResponse fromCheckIn(CheckIn checkIn, CheckInGamificationOutcome outcome) {
        return new CheckInResponse(
                checkIn.getId(),
                checkIn.getStudentId(),
                checkIn.getWorkoutId(),
                checkIn.getDate(),
                checkIn.getStatus(),
                checkIn.getFeeling(),
                checkIn.getNotes(),
                outcome.streakShields(),
                outcome.shieldEarnProgress(),
                outcome.shieldEarned(),
                outcome.shieldConsumed()
        );
    }
}
