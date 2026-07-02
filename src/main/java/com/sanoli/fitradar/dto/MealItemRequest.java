package com.sanoli.fitradar.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public record MealItemRequest(
        @NotNull UUID foodId,
        @NotNull @DecimalMin("0.01") BigDecimal quantidadeG,
        Integer ordem
) {
}
