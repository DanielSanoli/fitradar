package com.sanoli.fitradar.service;

import com.sanoli.fitradar.config.RetentionProperties;
import com.sanoli.fitradar.domain.AppUser;
import com.sanoli.fitradar.domain.BadgeType;
import com.sanoli.fitradar.domain.CheckIn;
import com.sanoli.fitradar.domain.CheckInStatus;
import com.sanoli.fitradar.domain.CreatorSpace;
import com.sanoli.fitradar.domain.StudentBadge;
import com.sanoli.fitradar.domain.UserRole;
import com.sanoli.fitradar.repository.CheckInRepository;
import com.sanoli.fitradar.repository.CreatorSpaceRepository;
import com.sanoli.fitradar.repository.StudentBadgeRepository;
import com.sanoli.fitradar.retention.engine.AdherenceResult;
import com.sanoli.fitradar.retention.engine.RetentionEngineService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.TreeSet;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MonthlyRecapServiceTest {

    private static final ZoneId ZONE = ZoneId.of("America/Sao_Paulo");

    @Mock
    private RetentionEngineService retentionEngineService;
    @Mock
    private CheckInRepository checkInRepository;
    @Mock
    private StudentBadgeRepository badgeRepository;
    @Mock
    private CreatorSpaceRepository creatorSpaceRepository;

    private MonthlyRecapService service;
    private UUID studentId;
    private UUID creatorId;
    private AppUser student;

    @BeforeEach
    void setUp() {
        Clock clock = Clock.fixed(Instant.parse("2026-07-02T12:00:00Z"), ZONE);
        RetentionProperties properties = new RetentionProperties();
        properties.setTimezone("America/Sao_Paulo");
        service = new MonthlyRecapService(
                retentionEngineService,
                checkInRepository,
                badgeRepository,
                creatorSpaceRepository,
                clock,
                properties
        );
        studentId = UUID.randomUUID();
        creatorId = UUID.randomUUID();
        student = new AppUser();
        student.setId(studentId);
        student.setCreatorId(creatorId);
        student.setRole(UserRole.STUDENT);
    }

    @Test
    void recapForStudent_withData_aggregatesMetricsAndComparison() {
        LocalDate from = LocalDate.of(2026, 6, 1);
        LocalDate to = LocalDate.of(2026, 6, 30);

        when(checkInRepository.countByStudentIdAndStatusAndDateBetween(
                eq(studentId), eq(CheckInStatus.DONE), eq(from), eq(to))).thenReturn(4L);
        when(retentionEngineService.adherenceDetail(studentId, from, to))
                .thenReturn(new AdherenceResult(new BigDecimal("80.00"), 5, 4, List.of("Aderência mensal")));

        when(checkInRepository.findByStudentIdAndStatusAndDateBetween(
                eq(studentId), eq(CheckInStatus.DONE), eq(from), eq(to)))
                .thenReturn(List.of(
                        checkIn(LocalDate.of(2026, 6, 10)),
                        checkIn(LocalDate.of(2026, 6, 11)),
                        checkIn(LocalDate.of(2026, 6, 12)),
                        checkIn(LocalDate.of(2026, 6, 20))
                ));

        LocalDate prevFrom = LocalDate.of(2026, 5, 1);
        LocalDate prevTo = LocalDate.of(2026, 5, 31);
        when(checkInRepository.countByStudentIdAndStatusAndDateBetween(
                eq(studentId), eq(CheckInStatus.DONE), eq(prevFrom), eq(prevTo))).thenReturn(2L);
        when(retentionEngineService.adherenceDetail(studentId, prevFrom, prevTo))
                .thenReturn(new AdherenceResult(new BigDecimal("50.00"), 4, 2, List.of()));
        when(checkInRepository.findByStudentIdAndStatusAndDateBetween(
                eq(studentId), eq(CheckInStatus.DONE), eq(prevFrom), eq(prevTo)))
                .thenReturn(List.of(
                        checkIn(LocalDate.of(2026, 5, 5)),
                        checkIn(LocalDate.of(2026, 5, 6))
                ));

        StudentBadge badge = new StudentBadge();
        badge.setBadgeType(BadgeType.STREAK_7);
        badge.setEarnedAt(Instant.parse("2026-06-15T15:00:00Z"));
        when(badgeRepository.findByStudentIdAndEarnedAtBetween(eq(studentId), any(), any()))
                .thenReturn(List.of(badge));

        CreatorSpace space = new CreatorSpace();
        space.setName("Studio Fit");
        space.setLogoUrl("https://cdn/logo.png");
        space.setPrimaryColor("#22c55e");
        when(creatorSpaceRepository.findByCreatorId(creatorId)).thenReturn(Optional.of(space));

        var recap = service.recapForStudent(student, 2026, 6);

        assertThat(recap.hasData()).isTrue();
        assertThat(recap.workoutsDone()).isEqualTo(4);
        assertThat(recap.adherence()).isEqualByComparingTo("80.00");
        assertThat(recap.longestStreakInMonth()).isEqualTo(3);
        assertThat(recap.xpEarned()).isEqualTo(40);
        assertThat(recap.highlightBadge()).isNotNull();
        assertThat(recap.highlightBadge().type()).isEqualTo(BadgeType.STREAK_7);
        assertThat(recap.comparison().workoutsDoneDelta()).isEqualTo(2L);
        assertThat(recap.comparison().adherenceDelta()).isEqualByComparingTo("30.00");
        assertThat(recap.comparison().longestStreakDelta()).isEqualTo(1);
        assertThat(recap.branding().spaceName()).isEqualTo("Studio Fit");
    }

    @Test
    void recapForStudent_emptyMonth_returnsHasDataFalse() {
        LocalDate from = LocalDate.of(2026, 6, 1);
        LocalDate to = LocalDate.of(2026, 6, 30);

        when(checkInRepository.countByStudentIdAndStatusAndDateBetween(
                eq(studentId), eq(CheckInStatus.DONE), eq(from), eq(to))).thenReturn(0L);
        when(retentionEngineService.adherenceDetail(studentId, from, to))
                .thenReturn(new AdherenceResult(null, 0, 0, List.of()));
        when(checkInRepository.findByStudentIdAndStatusAndDateBetween(
                eq(studentId), eq(CheckInStatus.DONE), eq(from), eq(to))).thenReturn(List.of());
        when(badgeRepository.findByStudentIdAndEarnedAtBetween(eq(studentId), any(), any()))
                .thenReturn(List.of());
        when(creatorSpaceRepository.findByCreatorId(creatorId)).thenReturn(Optional.empty());

        var recap = service.recapForStudent(student, 2026, 6);

        assertThat(recap.hasData()).isFalse();
        assertThat(recap.workoutsDone()).isZero();
        assertThat(recap.xpEarned()).isZero();
        assertThat(recap.highlightBadge()).isNull();
    }

    @Test
    void recapForStudent_rejectsOpenMonth() {
        assertThatThrownBy(() -> service.recapForStudent(student, 2026, 7))
                .hasMessageContaining("meses encerrados");
    }

    @Test
    void longestStreakInRange_findsMaxConsecutiveDays() {
        Set<LocalDate> dates = new TreeSet<>(Set.of(
                LocalDate.of(2026, 6, 1),
                LocalDate.of(2026, 6, 2),
                LocalDate.of(2026, 6, 5),
                LocalDate.of(2026, 6, 6),
                LocalDate.of(2026, 6, 7)
        ));

        int longest = MonthlyRecapService.longestStreakInRange(
                dates, LocalDate.of(2026, 6, 1), LocalDate.of(2026, 6, 30));

        assertThat(longest).isEqualTo(3);
    }

    private CheckIn checkIn(LocalDate date) {
        CheckIn checkIn = new CheckIn();
        checkIn.setStudentId(studentId);
        checkIn.setDate(date);
        checkIn.setStatus(CheckInStatus.DONE);
        return checkIn;
    }
}
