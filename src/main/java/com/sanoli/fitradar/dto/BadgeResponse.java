package com.sanoli.fitradar.dto;

import com.sanoli.fitradar.domain.StudentBadge;
import com.sanoli.fitradar.domain.BadgeType;

import java.time.Instant;
import java.util.UUID;

public record BadgeResponse(
        BadgeType type,
        String label,
        Instant earnedAt
) {
    public static BadgeResponse fromEntity(StudentBadge badge) {
        return new BadgeResponse(badge.getBadgeType(), labelFor(badge.getBadgeType()), badge.getEarnedAt());
    }

    private static String labelFor(BadgeType type) {
        return switch (type) {
            case FIRST_CHECKIN -> "Primeiro check-in";
            case STREAK_7 -> "Streak de 7 dias";
            case STREAK_30 -> "Streak de 30 dias";
            case CHECKINS_50 -> "50 treinos feitos";
        };
    }
}
