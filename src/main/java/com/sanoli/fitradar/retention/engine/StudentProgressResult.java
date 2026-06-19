package com.sanoli.fitradar.retention.engine;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record StudentProgressResult(
        UUID studentId,
        String studentName,
        boolean enrolled,
        BigDecimal adherence,        // últimos 30 dias; null se sem matrícula/dados
        int currentStreak,
        int weeklyDone,
        UUID nextWorkoutId,
        String nextWorkoutTitle,
        String message,
        List<String> assumptions
) {
}
