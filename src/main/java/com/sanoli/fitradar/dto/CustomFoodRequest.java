package com.sanoli.fitradar.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record CustomFoodRequest(
        @NotBlank @Size(max = 255) String nome,
        @NotNull @DecimalMin("0") BigDecimal kcalPor100g,
        @NotNull @DecimalMin("0") BigDecimal proteinaPor100g,
        @NotNull @DecimalMin("0") BigDecimal carboPor100g,
        @NotNull @DecimalMin("0") BigDecimal gorduraPor100g
) {
}
