package com.sanoli.fitradar.dto;

import com.sanoli.fitradar.domain.StudentGamificationProfile;

import java.util.UUID;

public record LeaderboardEntryResponse(
        int rank,
        UUID studentId,
        String studentName,
        int currentStreak,
        int totalCheckInsDone
) {
    public static LeaderboardEntryResponse fromProfile(StudentGamificationProfile profile, String studentName, int rank) {
        return new LeaderboardEntryResponse(
                rank,
                profile.getStudentId(),
                studentName,
                profile.getCurrentStreak(),
                profile.getTotalCheckInsDone()
        );
    }
}
