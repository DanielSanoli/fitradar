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
        String notes
) {
    public static CheckInResponse fromEntity(CheckIn checkIn) {
        return new CheckInResponse(
                checkIn.getId(),
                checkIn.getStudentId(),
                checkIn.getWorkoutId(),
                checkIn.getDate(),
                checkIn.getStatus(),
                checkIn.getFeeling(),
                checkIn.getNotes()
        );
    }
}
