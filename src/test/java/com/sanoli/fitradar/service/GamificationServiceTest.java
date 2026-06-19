package com.sanoli.fitradar.service;

import com.sanoli.fitradar.domain.AppUser;
import com.sanoli.fitradar.domain.BadgeType;
import com.sanoli.fitradar.domain.CheckInStatus;
import com.sanoli.fitradar.domain.UserRole;
import com.sanoli.fitradar.repository.StudentBadgeRepository;
import com.sanoli.fitradar.repository.StudentGamificationProfileRepository;
import com.sanoli.fitradar.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

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

        service.recordCheckIn(student, LocalDate.of(2026, 6, 18), CheckInStatus.DONE);

        verify(badgeRepository).save(any());
        ArgumentCaptor<com.sanoli.fitradar.domain.StudentGamificationProfile> captor =
                ArgumentCaptor.forClass(com.sanoli.fitradar.domain.StudentGamificationProfile.class);
        verify(profileRepository).save(captor.capture());
        assertThat(captor.getValue().getCurrentStreak()).isEqualTo(1);
        assertThat(captor.getValue().getTotalCheckInsDone()).isEqualTo(1);
    }

    @Test
    void recordCheckIn_skipped_doesNothing() {
        AppUser student = student(UUID.randomUUID(), UUID.randomUUID());
        service.recordCheckIn(student, LocalDate.now(), CheckInStatus.SKIPPED);
        verify(profileRepository, never()).save(any());
    }

    @Test
    void leaderboard_isScopedToCreator() {
        UUID creatorA = UUID.randomUUID();
        UUID studentA = UUID.randomUUID();
        var profile = new com.sanoli.fitradar.domain.StudentGamificationProfile();
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

    private AppUser student(UUID id, UUID creatorId) {
        AppUser user = new AppUser();
        user.setId(id);
        user.setCreatorId(creatorId);
        user.setRole(UserRole.STUDENT);
        user.setName("Aluno");
        return user;
    }
}
