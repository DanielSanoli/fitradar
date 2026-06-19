package com.sanoli.fitradar.dto;

import com.sanoli.fitradar.domain.StudentGamificationProfile;

import java.util.List;
import java.util.UUID;

public record GamificationProfileResponse(
        UUID studentId,
        int currentStreak,
        int longestStreak,
        int totalCheckInsDone,
        List<BadgeResponse> badges,
        int rank
) {
    public static GamificationProfileResponse fromProfile(
            StudentGamificationProfile profile,
            List<BadgeResponse> badges,
            int rank
    ) {
        return new GamificationProfileResponse(
                profile.getStudentId(),
                profile.getCurrentStreak(),
                profile.getLongestStreak(),
                profile.getTotalCheckInsDone(),
                badges,
                rank
        );
    }
}
