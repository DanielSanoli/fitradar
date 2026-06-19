package com.sanoli.fitradar.retention.engine;

import com.sanoli.fitradar.domain.RiskLevel;

import java.util.List;
import java.util.UUID;

public record ChurnRiskResult(
        UUID studentId,
        String studentName,
        int score,                 // 0..100
        RiskLevel level,           // LOW, MEDIUM, HIGH
        List<String> assumptions
) {
}
