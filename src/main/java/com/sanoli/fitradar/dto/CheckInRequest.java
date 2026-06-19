package com.sanoli.fitradar.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.UUID;

public record CheckInRequest(
        @NotNull(message = "workoutId é obrigatório")
        UUID workoutId,

        LocalDate date,

        Boolean skipped,

        @Min(value = 1, message = "feeling deve ser entre 1 e 5")
        @Max(value = 5, message = "feeling deve ser entre 1 e 5")
        Integer feeling,

        String notes
) {
}
