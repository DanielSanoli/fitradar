package com.sanoli.fitradar.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;

public record ProgramRequest(
        @NotBlank(message = "title é obrigatório")
        String title,

        String description,

        Boolean active,

        @PositiveOrZero(message = "price deve ser zero ou positivo")
        BigDecimal price
) {
}
