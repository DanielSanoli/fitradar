package com.sanoli.fitradar.retention.engine;

import java.math.BigDecimal;
import java.util.List;

public record CreatorAdherenceTrendResult(
        BigDecimal currentPeriodAdherence,
        BigDecimal previousPeriodAdherence,
        BigDecimal changePoints,
        List<AdherenceTrendPoint> weeklySeries,
        List<String> assumptions
) {
}
