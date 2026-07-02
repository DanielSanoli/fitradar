package com.sanoli.fitradar.service;

import com.sanoli.fitradar.domain.AppUser;
import com.sanoli.fitradar.domain.BadgeType;
import com.sanoli.fitradar.domain.CheckInStatus;
import com.sanoli.fitradar.domain.StudentGamificationProfile;
import com.sanoli.fitradar.domain.UserRole;
import com.sanoli.fitradar.dto.CheckInGamificationOutcome;
import com.sanoli.fitradar.repository.StudentBadgeRepository;
import com.sanoli.fitradar.repository.StudentGamificationProfileRepository;
import com.sanoli.fitradar.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class GamificationServiceTest {

    @Mock
    private StudentGamificationProfileRepository profileRepository;
    @Mock
    private StudentBadgeRepository badgeRepository;
    @Mock
    private UserRepository userRepository;

    private GamificationService service;

    @BeforeEach
    void setUp() {
        service = new GamificationService(profileRepository, badgeRepository, userRepository);
    }

    @Test
    void recordCheckIn_firstDone_awardsFirstCheckinBadge() {
        UUID creatorId = UUID.randomUUID();
        AppUser student = student(UUID.randomUUID(), creatorId);

        when(profileRepository.findById(student.getId())).thenReturn(Optional.empty());
        when(profileRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(badgeRepository.existsByStudentIdAndBadgeType(student.getId(), BadgeType.FIRST_CHECKIN)).thenReturn(false);

        CheckInGamificationOutcome outcome =
                service.recordCheckIn(student, LocalDate.of(2026, 6, 18), CheckInStatus.DONE);

        verify(badgeRepository).save(any());
        ArgumentCaptor<StudentGamificationProfile> captor = ArgumentCaptor.forClass(StudentGamificationProfile.class);
        verify(profileRepository).save(captor.capture());
        assertThat(captor.getValue().getCurrentStreak()).isEqualTo(1);
        assertThat(captor.getValue().getTotalCheckInsDone()).isEqualTo(1);
        assertThat(captor.getValue().getShieldEarnProgress()).isEqualTo(1);
        assertThat(outcome.shieldEarned()).isFalse();
        assertThat(outcome.shieldConsumed()).isFalse();
    }

    @Test
    void recordCheckIn_skipped_doesNothing() {
        AppUser student = student(UUID.randomUUID(), UUID.randomUUID());
        CheckInGamificationOutcome outcome =
                service.recordCheckIn(student, LocalDate.now(), CheckInStatus.SKIPPED);
        assertThat(outcome).isEqualTo(CheckInGamificationOutcome.none());
        verify(profileRepository, never()).save(any());
    }

    @Test
    void recordCheckIn_sevenConsecutiveDays_earnsShield() {
        UUID creatorId = UUID.randomUUID();
        AppUser student = student(UUID.randomUUID(), creatorId);
        StudentGamificationProfile profile = profile(student.getId(), creatorId);
        profile.setCurrentStreak(6);
        profile.setShieldEarnProgress(6);
        profile.setLastActivityDate(LocalDate.of(2026, 6, 17));

        when(profileRepository.findById(student.getId())).thenReturn(Optional.of(profile));
        when(profileRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        stubBadgeChecks(student.getId());

        CheckInGamificationOutcome outcome =
                service.recordCheckIn(student, LocalDate.of(2026, 6, 18), CheckInStatus.DONE);

        assertThat(outcome.shieldEarned()).isTrue();
        assertThat(outcome.streakShields()).isEqualTo(1);
        assertThat(outcome.shieldEarnProgress()).isZero();
        assertThat(profile.getCurrentStreak()).isEqualTo(7);
    }

    @Test
    void recordCheckIn_shieldEarnRespectsCapOfTwo() {
        UUID creatorId = UUID.randomUUID();
        AppUser student = student(UUID.randomUUID(), creatorId);
        StudentGamificationProfile profile = profile(student.getId(), creatorId);
        profile.setCurrentStreak(13);
        profile.setStreakShields(2);
        profile.setShieldEarnProgress(6);
        profile.setLastActivityDate(LocalDate.of(2026, 6, 17));

        when(profileRepository.findById(student.getId())).thenReturn(Optional.of(profile));
        when(profileRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        stubBadgeChecks(student.getId());

        CheckInGamificationOutcome outcome =
                service.recordCheckIn(student, LocalDate.of(2026, 6, 18), CheckInStatus.DONE);

        assertThat(outcome.shieldEarned()).isFalse();
        assertThat(outcome.streakShields()).isEqualTo(2);
        assertThat(outcome.shieldEarnProgress()).isZero();
    }

    @Test
    void recordCheckIn_oneDayGapWithShield_preservesStreakAndConsumesShield() {
        UUID creatorId = UUID.randomUUID();
        AppUser student = student(UUID.randomUUID(), creatorId);
        StudentGamificationProfile profile = profile(student.getId(), creatorId);
        profile.setCurrentStreak(5);
        profile.setStreakShields(1);
        profile.setShieldEarnProgress(3);
        profile.setLastActivityDate(LocalDate.of(2026, 6, 16));

        when(profileRepository.findById(student.getId())).thenReturn(Optional.of(profile));
        when(profileRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        stubBadgeChecks(student.getId());

        CheckInGamificationOutcome outcome =
                service.recordCheckIn(student, LocalDate.of(2026, 6, 18), CheckInStatus.DONE);

        assertThat(outcome.shieldConsumed()).isTrue();
        assertThat(outcome.streakShields()).isZero();
        assertThat(profile.getCurrentStreak()).isEqualTo(6);
        assertThat(profile.getShieldEarnProgress()).isEqualTo(4);
    }

    @Test
    void recordCheckIn_oneDayGapWithoutShield_resetsStreak() {
        UUID creatorId = UUID.randomUUID();
        AppUser student = student(UUID.randomUUID(), creatorId);
        StudentGamificationProfile profile = profile(student.getId(), creatorId);
        profile.setCurrentStreak(5);
        profile.setStreakShields(0);
        profile.setShieldEarnProgress(4);
        profile.setLastActivityDate(LocalDate.of(2026, 6, 16));

        when(profileRepository.findById(student.getId())).thenReturn(Optional.of(profile));
        when(profileRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        stubBadgeChecks(student.getId());

        CheckInGamificationOutcome outcome =
                service.recordCheckIn(student, LocalDate.of(2026, 6, 18), CheckInStatus.DONE);

        assertThat(outcome.shieldConsumed()).isFalse();
        assertThat(profile.getCurrentStreak()).isEqualTo(1);
        assertThat(profile.getShieldEarnProgress()).isZero();
    }

    @Test
    void recordCheckIn_gapGreaterThanOneDay_resetsEvenWithShields() {
        UUID creatorId = UUID.randomUUID();
        AppUser student = student(UUID.randomUUID(), creatorId);
        StudentGamificationProfile profile = profile(student.getId(), creatorId);
        profile.setCurrentStreak(10);
        profile.setStreakShields(2);
        profile.setShieldEarnProgress(5);
        profile.setLastActivityDate(LocalDate.of(2026, 6, 14));

        when(profileRepository.findById(student.getId())).thenReturn(Optional.of(profile));
        when(profileRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        stubBadgeChecks(student.getId());

        CheckInGamificationOutcome outcome =
                service.recordCheckIn(student, LocalDate.of(2026, 6, 18), CheckInStatus.DONE);

        assertThat(outcome.shieldConsumed()).isFalse();
        assertThat(outcome.streakShields()).isEqualTo(2);
        assertThat(profile.getCurrentStreak()).isEqualTo(1);
        assertThat(profile.getShieldEarnProgress()).isZero();
    }

    @Test
    void leaderboard_isScopedToCreator() {
        UUID creatorA = UUID.randomUUID();
        UUID studentA = UUID.randomUUID();
        var profile = new StudentGamificationProfile();
        profile.setStudentId(studentA);
        profile.setCreatorId(creatorA);
        profile.setCurrentStreak(5);
        profile.setTotalCheckInsDone(10);

        when(profileRepository.findByCreatorIdOrderByCurrentStreakDescTotalCheckInsDoneDesc(creatorA))
                .thenReturn(List.of(profile));
        when(userRepository.findById(studentA)).thenReturn(Optional.of(student(studentA, creatorA)));

        var entries = service.leaderboard(creatorA, 10);
        assertThat(entries).hasSize(1);
        assertThat(entries.get(0).studentId()).isEqualTo(studentA);
        verify(profileRepository, never()).findByCreatorIdOrderByCurrentStreakDescTotalCheckInsDoneDesc(UUID.randomUUID());
    }

    private void stubBadgeChecks(UUID studentId) {
        when(badgeRepository.existsByStudentIdAndBadgeType(studentId, BadgeType.FIRST_CHECKIN)).thenReturn(true);
        when(badgeRepository.existsByStudentIdAndBadgeType(studentId, BadgeType.STREAK_7)).thenReturn(false);
        when(badgeRepository.existsByStudentIdAndBadgeType(studentId, BadgeType.STREAK_30)).thenReturn(false);
        when(badgeRepository.existsByStudentIdAndBadgeType(studentId, BadgeType.CHECKINS_50)).thenReturn(false);
    }

    private StudentGamificationProfile profile(UUID studentId, UUID creatorId) {
        StudentGamificationProfile profile = new StudentGamificationProfile();
        profile.setStudentId(studentId);
        profile.setCreatorId(creatorId);
        return profile;
    }

    private AppUser student(UUID id, UUID creatorId) {
        AppUser user = new AppUser();
        user.setId(id);
        user.setCreatorId(creatorId);
        user.setRole(UserRole.STUDENT);
        user.setName("Aluno");
        return user;
    }
}
