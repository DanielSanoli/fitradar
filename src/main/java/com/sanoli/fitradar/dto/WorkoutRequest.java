package com.sanoli.fitradar.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;

public record WorkoutRequest(
        @NotBlank(message = "title é obrigatório")
        String title,

        String description,

        String contentMarkdown,

        @PositiveOrZero(message = "dayIndex deve ser zero ou positivo")
        int dayIndex
) {
}
