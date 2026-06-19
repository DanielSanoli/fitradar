package com.sanoli.fitradar.retention.ai;

import java.util.List;
import java.util.UUID;

public record NudgeSuggestion(
        UUID studentId,
        String studentName,
        String message,
        List<String> assumptions
) {
}
