package com.sanoli.fitradar.retention.engine;

import java.util.List;

public record CreatorRankingResult(
        RankingMetric metric,
        RankingPeriod period,
        List<CreatorRankingEntry> entries,
        List<String> assumptions
) {
}
