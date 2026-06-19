package com.sanoli.fitradar.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.UUID;

public record EnrollmentRequest(
        @NotNull(message = "programId é obrigatório")
        UUID programId,

        LocalDate startDate
) {
}
