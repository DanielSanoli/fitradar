package com.sanoli.fitradar.retention.engine;

import java.math.BigDecimal;
import java.util.List;

public record CreatorOverviewResult(
        int activeStudents,
        BigDecimal avgAdherence,   // pode ser null se não há dados
        int atRiskCount,
        int checkInsThisWeek,
        int newStudentsThisWeek,
        List<String> assumptions
) {
}
