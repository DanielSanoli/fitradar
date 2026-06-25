package com.sanoli.fitradar.dto;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public record AccountDataExportResponse(
        Instant exportedAt,
        String termsVersion,
        Map<String, Object> account,
        Map<String, Object> settings,
        List<Map<String, Object>> checkIns,
        List<Map<String, Object>> enrollments,
        List<Map<String, Object>> badges,
        Map<String, Object> gamification,
        List<Map<String, Object>> alerts,
        Map<String, Object> creatorSpace,
        List<Map<String, Object>> programs
) {
}
