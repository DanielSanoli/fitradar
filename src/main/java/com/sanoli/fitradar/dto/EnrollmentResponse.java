package com.sanoli.fitradar.dto;

import com.sanoli.fitradar.domain.Enrollment;

import java.time.LocalDate;
import java.util.UUID;

public record EnrollmentResponse(
        UUID id,
        UUID studentId,
        UUID programId,
        String programTitle,
        LocalDate startDate,
        boolean active
) {
    public static EnrollmentResponse fromEntity(Enrollment enrollment, String programTitle) {
        return new EnrollmentResponse(
                enrollment.getId(),
                enrollment.getStudentId(),
                enrollment.getProgramId(),
                programTitle,
                enrollment.getStartDate(),
                enrollment.isActive()
        );
    }
}
