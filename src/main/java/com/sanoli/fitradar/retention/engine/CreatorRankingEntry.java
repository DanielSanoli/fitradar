package com.sanoli.fitradar.retention.engine;

import java.math.BigDecimal;
import java.util.UUID;

public record CreatorRankingEntry(
        int rank,
        UUID studentId,
        String studentName,
        BigDecimal value
) {
}
