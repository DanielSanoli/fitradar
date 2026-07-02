package com.sanoli.fitradar.dto;

import java.math.BigDecimal;
import java.util.List;

/**
 * Retrospectiva mensal determinística do aluno (motor, sem IA).
 */
public record MonthlyRecapResult(
        int year,
        int month,
        String monthLabel,
        boolean hasData,
        long workoutsDone,
        BigDecimal adherence,
        int longestStreakInMonth,
        int xpEarned,
        BadgeResponse highlightBadge,
        MonthlyRecapComparison comparison,
        MonthlyRecapBranding branding,
        List<String> assumptions
) {
}
