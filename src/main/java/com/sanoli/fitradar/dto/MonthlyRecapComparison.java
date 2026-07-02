package com.sanoli.fitradar.dto;

import java.math.BigDecimal;

/**
 * Comparativo com o mês anterior (null quando não há base de comparação).
 */
public record MonthlyRecapComparison(
        Long workoutsDoneDelta,
        BigDecimal adherenceDelta,
        Integer longestStreakDelta
) {
}
