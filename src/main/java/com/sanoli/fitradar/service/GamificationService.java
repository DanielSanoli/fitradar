package com.sanoli.fitradar.service;

import com.sanoli.fitradar.domain.AppUser;
import com.sanoli.fitradar.domain.BadgeType;
import com.sanoli.fitradar.domain.CheckInStatus;
import com.sanoli.fitradar.domain.StudentBadge;
import com.sanoli.fitradar.domain.StudentGamificationProfile;
import com.sanoli.fitradar.dto.BadgeResponse;
import com.sanoli.fitradar.dto.GamificationProfileResponse;
import com.sanoli.fitradar.dto.LeaderboardEntryResponse;
import com.sanoli.fitradar.repository.StudentBadgeRepository;
import com.sanoli.fitradar.repository.StudentGamificationProfileRepository;
import com.sanoli.fitradar.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class GamificationService {

    private final StudentGamificationProfileRepository profileRepository;
    private final StudentBadgeRepository badgeRepository;
    private final UserRepository userRepository;

    public GamificationService(
            StudentGamificationProfileRepository profileRepository,
            StudentBadgeRepository badgeRepository,
            UserRepository userRepository
    ) {
        this.profileRepository = profileRepository;
        this.badgeRepository = badgeRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public void recordCheckIn(AppUser student, LocalDate date, CheckInStatus status) {
        if (status != CheckInStatus.DONE || student.getCreatorId() == null) {
            return;
        }

        StudentGamificationProfile profile = profileRepository.findById(student.getId())
                .orElseGet(() -> newProfile(student));

        if (profile.getLastActivityDate() == null) {
            profile.setCurrentStreak(1);
        } else if (date.equals(profile.getLastActivityDate())) {
            // Mesmo dia: mantém streak, só incrementa total.
        } else if (date.equals(profile.getLastActivityDate().plusDays(1))) {
            profile.setCurrentStreak(profile.getCurrentStreak() + 1);
        } else if (date.isAfter(profile.getLastActivityDate())) {
            profile.setCurrentStreak(1);
        }

        profile.setLastActivityDate(date);
        profile.setTotalCheckInsDone(profile.getTotalCheckInsDone() + 1);
        profile.setLongestStreak(Math.max(profile.getLongestStreak(), profile.getCurrentStreak()));
        profileRepository.save(profile);

        awardBadges(student, profile);
    }

    @Transactional(readOnly = true)
    public GamificationProfileResponse profileForStudent(AppUser student) {
        StudentGamificationProfile profile = profileRepository.findById(student.getId()).orElse(null);
        List<BadgeResponse> badges = badgeRepository.findByStudentIdOrderByEarnedAtDesc(student.getId()).stream()
                .map(BadgeResponse::fromEntity)
                .toList();

        if (profile == null) {
            return new GamificationProfileResponse(
                    student.getId(), 0, 0, 0, badges, 0);
        }

        int rank = rankForStudent(student.getCreatorId(), student.getId());
        return GamificationProfileResponse.fromProfile(profile, badges, rank);
    }

    @Transactional(readOnly = true)
    public List<LeaderboardEntryResponse> leaderboard(UUID creatorId, int limit) {
        List<StudentGamificationProfile> profiles =
                profileRepository.findByCreatorIdOrderByCurrentStreakDescTotalCheckInsDoneDesc(creatorId);
        List<LeaderboardEntryResponse> entries = new ArrayList<>();
        int rank = 1;
        for (StudentGamificationProfile profile : profiles) {
            if (rank > limit) {
                break;
            }
            String name = userRepository.findById(profile.getStudentId())
                    .map(AppUser::getName)
                    .orElse("Aluno");
            entries.add(LeaderboardEntryResponse.fromProfile(profile, name, rank));
            rank++;
        }
        return entries;
    }

    private void awardBadges(AppUser student, StudentGamificationProfile profile) {
        tryAward(student, BadgeType.FIRST_CHECKIN, profile.getTotalCheckInsDone() >= 1);
        tryAward(student, BadgeType.STREAK_7, profile.getCurrentStreak() >= 7);
        tryAward(student, BadgeType.STREAK_30, profile.getCurrentStreak() >= 30);
        tryAward(student, BadgeType.CHECKINS_50, profile.getTotalCheckInsDone() >= 50);
    }

    private void tryAward(AppUser student, BadgeType type, boolean eligible) {
        if (!eligible || badgeRepository.existsByStudentIdAndBadgeType(student.getId(), type)) {
            return;
        }
        StudentBadge badge = new StudentBadge();
        badge.setStudentId(student.getId());
        badge.setCreatorId(student.getCreatorId());
        badge.setBadgeType(type);
        badgeRepository.save(badge);
    }

    private StudentGamificationProfile newProfile(AppUser student) {
        StudentGamificationProfile profile = new StudentGamificationProfile();
        profile.setStudentId(student.getId());
        profile.setCreatorId(student.getCreatorId());
        return profile;
    }

    private int rankForStudent(UUID creatorId, UUID studentId) {
        List<StudentGamificationProfile> profiles =
                profileRepository.findByCreatorIdOrderByCurrentStreakDescTotalCheckInsDoneDesc(creatorId);
        for (int i = 0; i < profiles.size(); i++) {
            if (profiles.get(i).getStudentId().equals(studentId)) {
                return i + 1;
            }
        }
        return 0;
    }
}
