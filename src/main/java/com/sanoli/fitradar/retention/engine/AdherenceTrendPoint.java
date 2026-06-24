package com.sanoli.fitradar.retention.engine;

import java.math.BigDecimal;
import java.time.LocalDate;

public record AdherenceTrendPoint(
        LocalDate weekStart,
        BigDecimal avgAdherence
) {
}
