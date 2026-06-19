package com.sanoli.fitradar.dto;

import com.sanoli.fitradar.domain.Alert;
import com.sanoli.fitradar.domain.AlertType;
import com.sanoli.fitradar.domain.Severity;

import java.time.Instant;
import java.util.UUID;

public record AlertResponse(
        UUID id,
        UUID subjectStudentId,
        AlertType type,
        Severity severity,
        String message,
        String actionSuggestion,
        String dataSnapshot,
        Instant createdAt,
        boolean read
) {
    public static AlertResponse fromEntity(Alert alert) {
        return new AlertResponse(
                alert.getId(),
                alert.getSubjectStudentId(),
                alert.getType(),
                alert.getSeverity(),
                alert.getMessage(),
                alert.getActionSuggestion(),
                alert.getDataSnapshot(),
                alert.getCreatedAt(),
                alert.isRead()
        );
    }
}
