package com.sanoli.fitradar.retention.engine;

import com.sanoli.fitradar.config.RetentionProperties;
import com.sanoli.fitradar.domain.AppUser;
import com.sanoli.fitradar.domain.CheckIn;
import com.sanoli.fitradar.domain.CheckInStatus;
import com.sanoli.fitradar.domain.Enrollment;
import com.sanoli.fitradar.domain.RiskLevel;
import com.sanoli.fitradar.domain.UserRole;
import com.sanoli.fitradar.domain.Workout;
import com.sanoli.fitradar.repository.CheckInRepository;
import com.sanoli.fitradar.repository.EnrollmentRepository;
import com.sanoli.fitradar.repository.UserRepository;
import com.sanoli.fitradar.repository.WorkoutRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class RetentionEngineServiceTest {

    private static final LocalDate TODAY = LocalDate.of(2026, 6, 18);

    private CheckInRepository checkInRepository;
    private EnrollmentRepository enrollmentRepository;
    private WorkoutRepository workoutRepository;
    private UserRepository userRepository;
    private RetentionEngineService engine;

    @BeforeEach
    void setUp() {
        checkInRepository = mock(CheckInRepository.class);
        enrollmentRepository = mock(EnrollmentRepository.class);
        workoutRepository = mock(WorkoutRepository.class);
        userRepository = mock(UserRepository.class);
        Clock clock = Clock.fixed(Instant.parse("2026-06-18T12:00:00Z"), ZoneOffset.UTC);
        engine = new RetentionEngineService(
                checkInRepository, enrollmentRepository, workoutRepository, userRepository,
                new RetentionProperties(), clock);
    }

    // ----------------------------- 5.1 adherenceRate -----------------------------

    @Test
    void adherenceRate_withoutEnrollment_returnsNull() {
        UUID student = UUID.randomUUID();
        when(enrollmentRepository.findByStudentIdAndActiveTrue(student)).thenReturn(List.of());

        assertThat(engine.adherenceRate(student, TODAY.minusDays(6), TODAY)).isNull();
    }

    @Test
    void adherenceRate_computesPercentageWithoutDividingByZero() {
        UUID student = UUID.randomUUID();
        UUID program = UUID.randomUUID();
        when(enrollmentRepository.findByStudentIdAndActiveTrue(student))
                .thenReturn(List.of(enrollment(student, program, TODAY.minusDays(60))));
        when(workoutRepository.countByProgramId(program)).thenReturn(4L); // 4/semana => 4 esperados em 7 dias
        when(checkInRepository.countByStudentIdAndStatusAndDateBetween(
                eq(student), eq(CheckInStatus.DONE), any(), any())).thenReturn(1L);

        BigDecimal rate = engine.adherenceRate(student, TODAY.minusDays(6), TODAY);

        assertThat(rate).isEqualByComparingTo("25.00");
    }

    // ----------------------------- 5.2 daysSinceLastActivity -----------------------------

    @Test
    void daysSinceLastActivity_neverCheckedIn_returnsNull() {
        UUID student = UUID.randomUUID();
        when(checkInRepository.findMaxDateByStudentId(student)).thenReturn(Optional.empty());

        assertThat(engine.daysSinceLastActivity(student)).isNull();
    }

    @Test
    void daysSinceLastActivity_returnsDayDifference() {
        UUID student = UUID.randomUUID();
        when(checkInRepository.findMaxDateByStudentId(student)).thenReturn(Optional.of(TODAY.minusDays(3)));

        assertThat(engine.daysSinceLastActivity(student)).isEqualTo(3L);
    }

    // ----------------------------- 5.3 churnRiskScore -----------------------------

    @Test
    void churnRiskScore_newStudent_isNotClassifiedHigh() {
        UUID student = UUID.randomUUID();
        when(userRepository.findById(student)).thenReturn(Optional.of(user(student, "Novato", UserRole.STUDENT)));
        when(checkInRepository.findMaxDateByStudentId(student)).thenReturn(Optional.empty());
        when(enrollmentRepository.findByStudentIdAndActiveTrue(student))
                .thenReturn(List.of(enrollment(student, UUID.randomUUID(), TODAY.minusDays(2))));

        ChurnRiskResult result = engine.churnRiskScore(student);

        assertThat(result.level()).isEqualTo(RiskLevel.LOW);
        assertThat(result.score()).isEqualTo(0);
        assertThat(result.assumptions()).isNotEmpty();
    }

    @Test
    void churnRiskScore_inactiveAndLowAdherence_isHighAndBounded() {
        UUID student = UUID.randomUUID();
        UUID program = UUID.randomUUID();
        when(userRepository.findById(student)).thenReturn(Optional.of(user(student, "Sumido", UserRole.STUDENT)));
        when(checkInRepository.findMaxDateByStudentId(student)).thenReturn(Optional.of(TODAY.minusDays(30)));
        when(enrollmentRepository.findByStudentIdAndActiveTrue(student))
                .thenReturn(List.of(enrollment(student, program, TODAY.minusDays(60))));
        when(workoutRepository.countByProgramId(program)).thenReturn(3L);
        when(checkInRepository.countByStudentIdAndStatusAndDateBetween(
                eq(student), eq(CheckInStatus.DONE), any(), any())).thenReturn(0L);

        ChurnRiskResult result = engine.churnRiskScore(student);

        assertThat(result.score()).isBetween(0, 100);
        assertThat(result.level()).isEqualTo(RiskLevel.HIGH);
    }

    // ----------------------------- 5.4 studentsAtRisk -----------------------------

    @Test
    void studentsAtRisk_returnsEmptyWhenNobodyAtRisk() {
        UUID creator = UUID.randomUUID();
        when(userRepository.findByCreatorIdAndRole(creator, UserRole.STUDENT)).thenReturn(List.of());

        assertThat(engine.studentsAtRisk(creator, RiskLevel.MEDIUM)).isEmpty();
    }

    @Test
    void studentsAtRisk_isScopedToCreator_neverLeaksOtherTenant() {
        UUID creatorA = UUID.randomUUID();
        UUID creatorB = UUID.randomUUID();
        UUID studentA = UUID.randomUUID();
        UUID program = UUID.randomUUID();

        when(userRepository.findByCreatorIdAndRole(creatorA, UserRole.STUDENT))
                .thenReturn(List.of(user(studentA, "Aluno A", UserRole.STUDENT)));
        // studentA está em risco alto
        when(userRepository.findById(studentA)).thenReturn(Optional.of(user(studentA, "Aluno A", UserRole.STUDENT)));
        when(enrollmentRepository.findByStudentIdAndActiveTrue(studentA))
                .thenReturn(List.of(enrollment(studentA, program, TODAY.minusDays(60))));
        when(workoutRepository.countByProgramId(program)).thenReturn(3L);
        when(checkInRepository.findMaxDateByStudentId(studentA)).thenReturn(Optional.of(TODAY.minusDays(30)));
        when(checkInRepository.countByStudentIdAndStatusAndDateBetween(
                eq(studentA), eq(CheckInStatus.DONE), any(), any())).thenReturn(0L);

        List<ChurnRiskResult> result = engine.studentsAtRisk(creatorA, RiskLevel.MEDIUM);

        assertThat(result).extracting(ChurnRiskResult::studentId).containsExactly(studentA);
        verify(userRepository, never()).findByCreatorIdAndRole(eq(creatorB), any());
    }

    // ----------------------------- 5.5 creatorOverview -----------------------------

    @Test
    void creatorOverview_withoutStudents_returnsCoherentZeros() {
        UUID creator = UUID.randomUUID();
        when(userRepository.findByCreatorIdAndRole(creator, UserRole.STUDENT)).thenReturn(List.of());

        CreatorOverviewResult overview = engine.creatorOverview(creator);

        assertThat(overview.activeStudents()).isZero();
        assertThat(overview.avgAdherence()).isNull();
        assertThat(overview.atRiskCount()).isZero();
        assertThat(overview.checkInsThisWeek()).isZero();
        assertThat(overview.newStudentsThisWeek()).isZero();
    }

    // ----------------------------- 5.6 studentProgress -----------------------------

    @Test
    void studentProgress_withoutEnrollment_promptsToStartProgram() {
        UUID student = UUID.randomUUID();
        when(userRepository.findById(student)).thenReturn(Optional.of(user(student, "Aluno", UserRole.STUDENT)));
        when(enrollmentRepository.findByStudentIdAndActiveTrue(student)).thenReturn(List.of());

        StudentProgressResult progress = engine.studentProgress(student);

        assertThat(progress.enrolled()).isFalse();
        assertThat(progress.currentStreak()).isGreaterThanOrEqualTo(0);
        assertThat(progress.message()).contains("Comece um programa");
    }

    @Test
    void studentProgress_streakIsNeverNegativeAndPicksNextWorkout() {
        UUID student = UUID.randomUUID();
        UUID program = UUID.randomUUID();
        UUID workout1 = UUID.randomUUID();
        UUID workout2 = UUID.randomUUID();

        when(userRepository.findById(student)).thenReturn(Optional.of(user(student, "Aluno", UserRole.STUDENT)));
        when(enrollmentRepository.findByStudentIdAndActiveTrue(student))
                .thenReturn(List.of(enrollment(student, program, TODAY.minusDays(30))));
        when(workoutRepository.countByProgramId(program)).thenReturn(2L);
        when(workoutRepository.findByProgramIdOrderByDayIndexAsc(program))
                .thenReturn(List.of(workout(workout1, program, 0), workout(workout2, program, 1)));
        when(checkInRepository.findByStudentIdOrderByDateDesc(student))
                .thenReturn(List.of(checkIn(student, workout1, TODAY)));
        when(checkInRepository.countByStudentIdAndStatusAndDateBetween(
                eq(student), eq(CheckInStatus.DONE), any(), any())).thenReturn(1L);

        StudentProgressResult progress = engine.studentProgress(student);

        assertThat(progress.enrolled()).isTrue();
        assertThat(progress.currentStreak()).isEqualTo(1);
        assertThat(progress.nextWorkoutId()).isEqualTo(workout2);
    }

    // ----------------------------- fixtures -----------------------------

    private AppUser user(UUID id, String name, UserRole role) {
        AppUser user = new AppUser();
        user.setId(id);
        user.setName(name);
        user.setRole(role);
        return user;
    }

    private Enrollment enrollment(UUID studentId, UUID programId, LocalDate startDate) {
        Enrollment enrollment = new Enrollment();
        enrollment.setId(UUID.randomUUID());
        enrollment.setStudentId(studentId);
        enrollment.setProgramId(programId);
        enrollment.setStartDate(startDate);
        enrollment.setActive(true);
        return enrollment;
    }

    private Workout workout(UUID id, UUID programId, int dayIndex) {
        Workout workout = new Workout();
        workout.setId(id);
        workout.setProgramId(programId);
        workout.setTitle("Treino " + dayIndex);
        workout.setDayIndex(dayIndex);
        return workout;
    }

    private CheckIn checkIn(UUID studentId, UUID workoutId, LocalDate date) {
        CheckIn checkIn = new CheckIn();
        checkIn.setId(UUID.randomUUID());
        checkIn.setStudentId(studentId);
        checkIn.setWorkoutId(workoutId);
        checkIn.setDate(date);
        checkIn.setStatus(CheckInStatus.DONE);
        return checkIn;
    }
}
