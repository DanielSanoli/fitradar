package com.sanoli.fitradar.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalTime;

public record MealRequest(
        @NotBlank @Size(max = 255) String nome,
        LocalTime horario,
        Integer ordem
) {
}
