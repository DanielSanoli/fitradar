package com.sanoli.fitradar.service;

import com.sanoli.fitradar.domain.AppUser;
import com.sanoli.fitradar.domain.BadgeType;
import com.sanoli.fitradar.domain.CheckInStatus;
import com.sanoli.fitradar.domain.StudentBadge;
import com.sanoli.fitradar.domain.StudentGamificationProfile;
import com.sanoli.fitradar.dto.BadgeResponse;
import com.sanoli.fitradar.dto.CheckInGamificationOutcome;
import com.sanoli.fitradar.dto.GamificationProfileResponse;
import com.sanoli.fitradar.dto.LeaderboardEntryResponse;
import com.sanoli.fitradar.repository.StudentBadgeRepository;
import com.sanoli.fitradar.repository.StudentGamificationProfileRepository;
import com.sanoli.fitradar.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class GamificationService {

    static final int MAX_STREAK_SHIELDS = 2;
    static final int DAYS_PER_SHIELD = 7;

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
    public CheckInGamificationOutcome recordCheckIn(AppUser student, LocalDate date, CheckInStatus status) {
        if (status != CheckInStatus.DONE || student.getCreatorId() == null) {
            return CheckInGamificationOutcome.none();
        }

        StudentGamificationProfile profile = profileRepository.findById(student.getId())
                .orElseGet(() -> newProfile(student));

        boolean shieldEarned = false;
        boolean shieldConsumed = false;
        boolean advanceShieldProgress = false;

        LocalDate lastActivity = profile.getLastActivityDate();
        if (lastActivity == null) {
            profile.setCurrentStreak(1);
            advanceShieldProgress = true;
        } else if (date.equals(lastActivity)) {
            // Mesmo dia: mantém streak, só incrementa total.
        } else if (date.equals(lastActivity.plusDays(1))) {
            profile.setCurrentStreak(profile.getCurrentStreak() + 1);
            advanceShieldProgress = true;
        } else if (date.isAfter(lastActivity)) {
            long daysBetween = ChronoUnit.DAYS.between(lastActivity, date);
            if (daysBetween == 2 && profile.getStreakShields() > 0) {
                profile.setStreakShields(profile.getStreakShields() - 1);
                shieldConsumed = true;
                profile.setCurrentStreak(profile.getCurrentStreak() + 1);
                advanceShieldProgress = true;
            } else {
                profile.setCurrentStreak(1);
                profile.setShieldEarnProgress(0);
            }
        }

        if (advanceShieldProgress) {
            shieldEarned = advanceShieldEarnProgress(profile);
        }

        profile.setLastActivityDate(date);
        profile.setTotalCheckInsDone(profile.getTotalCheckInsDone() + 1);
        profile.setLongestStreak(Math.max(profile.getLongestStreak(), profile.getCurrentStreak()));
        profileRepository.save(profile);

        awardBadges(student, profile);

        return new CheckInGamificationOutcome(
                profile.getStreakShields(),
                profile.getShieldEarnProgress(),
                shieldEarned,
                shieldConsumed
        );
    }

    /**
     * Incrementa progresso semanal (0–6) e concede escudo a cada 7 dias de streak, cap 2.
     */
    private boolean advanceShieldEarnProgress(StudentGamificationProfile profile) {
        int progress = profile.getShieldEarnProgress() + 1;
        if (progress < DAYS_PER_SHIELD) {
            profile.setShieldEarnProgress(progress);
            return false;
        }

        profile.setShieldEarnProgress(0);
        if (profile.getStreakShields() >= MAX_STREAK_SHIELDS) {
            return false;
        }
        profile.setStreakShields(profile.getStreakShields() + 1);
        return true;
    }

    @Transactional(readOnly = true)
    public GamificationProfileResponse profileForStudent(AppUser student) {
        StudentGamificationProfile profile = profileRepository.findById(student.getId()).orElse(null);
        List<BadgeResponse> badges = badgeRepository.findByStudentIdOrderByEarnedAtDesc(student.getId()).stream()
                .map(BadgeResponse::fromEntity)
                .toList();

        if (profile == null) {
            return new GamificationProfileResponse(
                    student.getId(), 0, 0, 0, 0, 0, badges, 0);
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
