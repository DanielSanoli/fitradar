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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Motor determinístico de retenção (camada retention.engine).
 *
 * Regra de Ouro: todos os números (aderência, inatividade, risco) são calculados aqui,
 * em código testável com {@link Clock} injetado. Percentuais em BigDecimal (HALF_EVEN, 2 casas).
 * A IA apenas interpreta os DTOs.
 */
@Service
public class RetentionEngineService {

    private static final int PCT_SCALE = 2;
    private static final BigDecimal HUNDRED = new BigDecimal("100");

    private final CheckInRepository checkInRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final WorkoutRepository workoutRepository;
    private final UserRepository userRepository;
    private final RetentionProperties properties;
    private final Clock clock;

    public RetentionEngineService(
            CheckInRepository checkInRepository,
            EnrollmentRepository enrollmentRepository,
            WorkoutRepository workoutRepository,
            UserRepository userRepository,
            RetentionProperties properties,
            Clock clock
    ) {
        this.checkInRepository = checkInRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.workoutRepository = workoutRepository;
        this.userRepository = userRepository;
        this.properties = properties;
        this.clock = clock;
    }

    // ---------------------------------------------------------------------
    // 5.1 adherenceRate
    // ---------------------------------------------------------------------

    @Transactional(readOnly = true)
    public BigDecimal adherenceRate(UUID studentId, LocalDate from, LocalDate to) {
        return adherenceDetail(studentId, from, to).rate();
    }

    @Transactional(readOnly = true)
    public AdherenceResult adherenceDetail(UUID studentId, LocalDate from, LocalDate to) {
        List<String> assumptions = new ArrayList<>();
        long expected = expectedWorkouts(studentId, from, to);

        if (expected <= 0) {
            assumptions.add("Sem treinos previstos no período (aluno sem matrícula ativa)");
            return new AdherenceResult(null, 0, 0, assumptions);
        }

        long done = checkInRepository.countByStudentIdAndStatusAndDateBetween(
                studentId, CheckInStatus.DONE, from, to);

        BigDecimal rate = BigDecimal.valueOf(done)
                .divide(BigDecimal.valueOf(expected), 10, RoundingMode.HALF_EVEN)
                .multiply(HUNDRED);
        rate = clampPercent(rate).setScale(PCT_SCALE, RoundingMode.HALF_EVEN);

        assumptions.add(String.format("%d de %d treino(s) previsto(s) realizados no período", done, expected));
        return new AdherenceResult(rate, expected, done, assumptions);
    }

    // ---------------------------------------------------------------------
    // 5.2 daysSinceLastActivity
    // ---------------------------------------------------------------------

    @Transactional(readOnly = true)
    public Long daysSinceLastActivity(UUID studentId) {
        return checkInRepository.findMaxDateByStudentId(studentId)
                .map(last -> ChronoUnit.DAYS.between(last, today()))
                .orElse(null);
    }

    // ---------------------------------------------------------------------
    // 5.3 churnRiskScore
    // ---------------------------------------------------------------------

    @Transactional(readOnly = true)
    public ChurnRiskResult churnRiskScore(UUID studentId) {
        AppUser student = userRepository.findById(studentId).orElse(null);
        String name = student != null ? student.getName() : "Aluno";
        LocalDate today = today();
        List<String> assumptions = new ArrayList<>();

        Long daysInactive = daysSinceLastActivity(studentId);
        Long enrollmentAgeDays = enrollmentAgeDays(studentId, today);
        boolean hasAnyCheckIn = daysInactive != null;

        // Aluno novo / sem dados suficientes não é classificado como HIGH por falta de dados.
        boolean insufficientData = !hasAnyCheckIn
                && (enrollmentAgeDays == null || enrollmentAgeDays < properties.getMinHistoryDays());
        if (insufficientData) {
            assumptions.add("Aluno novo ou sem dados suficientes — não classificado como alto risco");
            return new ChurnRiskResult(studentId, name, 0, RiskLevel.LOW, assumptions);
        }

        BigDecimal recent = adherenceRate(studentId, today.minusDays(6), today);
        BigDecimal previous = adherenceRate(studentId, today.minusDays(13), today.minusDays(7));

        long inactiveForFactor = daysInactive != null
                ? daysInactive
                : (enrollmentAgeDays != null ? enrollmentAgeDays : 0L);

        BigDecimal f1 = clampUnit(BigDecimal.valueOf(inactiveForFactor)
                .divide(BigDecimal.valueOf(Math.max(1, properties.getInactivitySaturationDays())), 10, RoundingMode.HALF_EVEN));

        BigDecimal f2 = BigDecimal.ZERO;
        if (recent != null && previous != null && previous.compareTo(recent) > 0) {
            f2 = clampUnit(previous.subtract(recent).divide(HUNDRED, 10, RoundingMode.HALF_EVEN));
        }

        BigDecimal referenceAdherence = recent != null ? recent : previous;
        BigDecimal f3 = BigDecimal.ZERO;
        if (referenceAdherence != null) {
            f3 = clampUnit(HUNDRED.subtract(referenceAdherence).divide(HUNDRED, 10, RoundingMode.HALF_EVEN));
        }

        BigDecimal weighted = properties.getWeights().getInactivity().multiply(f1)
                .add(properties.getWeights().getAdherenceDrop().multiply(f2))
                .add(properties.getWeights().getLowAdherence().multiply(f3));

        int score = clampScore(weighted.multiply(HUNDRED).setScale(0, RoundingMode.HALF_EVEN).intValue());
        RiskLevel level = levelFor(score);

        if (daysInactive != null) {
            assumptions.add(String.format("Inativo há %d dia(s)", daysInactive));
        } else {
            assumptions.add(String.format("Sem nenhum check-in há %d dia(s) desde a matrícula", inactiveForFactor));
        }
        if (recent != null && previous != null) {
            if (previous.compareTo(recent) > 0) {
                assumptions.add(String.format("Aderência caiu de %s%% para %s%% (7d vs 7d anteriores)",
                        previous.toPlainString(), recent.toPlainString()));
            } else {
                assumptions.add(String.format("Aderência recente de %s%% (estável vs 7d anteriores)", recent.toPlainString()));
            }
        } else if (referenceAdherence != null) {
            assumptions.add(String.format("Aderência recente de %s%%", referenceAdherence.toPlainString()));
        }

        return new ChurnRiskResult(studentId, name, score, level, assumptions);
    }

    // ---------------------------------------------------------------------
    // 5.4 studentsAtRisk
    // ---------------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<ChurnRiskResult> studentsAtRisk(UUID creatorId, RiskLevel minLevel) {
        RiskLevel threshold = minLevel != null ? minLevel : RiskLevel.MEDIUM;
        List<AppUser> active = activeStudents(creatorId);
        if (active.isEmpty()) {
            return List.of();
        }
        RetentionBatchContext batch = RetentionBatchContext.load(
                active, enrollmentRepository, workoutRepository, checkInRepository, today(), properties);
        LocalDate today = today();
        List<ChurnRiskResult> atRisk = new ArrayList<>();
        for (AppUser student : active) {
            ChurnRiskResult risk = batch.churnRisk(student.getId(), today);
            if (risk.level().ordinal() >= threshold.ordinal()) {
                atRisk.add(risk);
            }
        }
        atRisk.sort(Comparator.comparingInt(ChurnRiskResult::score).reversed());
        return atRisk;
    }

    // ---------------------------------------------------------------------
    // 5.5 creatorOverview
    // ---------------------------------------------------------------------

    @Transactional(readOnly = true)
    public CreatorOverviewResult creatorOverview(UUID creatorId) {
        LocalDate today = today();
        LocalDate weekStart = today.with(DayOfWeek.MONDAY);
        List<AppUser> students = userRepository.findByCreatorIdAndRole(creatorId, UserRole.STUDENT);
        List<AppUser> active = activeStudents(creatorId);

        RetentionBatchContext batch = RetentionBatchContext.load(
                students, enrollmentRepository, workoutRepository, checkInRepository, today, properties);

        BigDecimal sum = BigDecimal.ZERO;
        int counted = 0;
        int atRiskCount = 0;
        for (AppUser student : active) {
            BigDecimal adherence = batch.adherenceRate(student.getId(), today.minusDays(29), today);
            if (adherence != null) {
                sum = sum.add(adherence);
                counted++;
            }
            ChurnRiskResult risk = batch.churnRisk(student.getId(), today);
            if (risk.level().ordinal() >= RiskLevel.MEDIUM.ordinal()) {
                atRiskCount++;
            }
        }
        BigDecimal avgAdherence = counted > 0
                ? sum.divide(BigDecimal.valueOf(counted), PCT_SCALE, RoundingMode.HALF_EVEN)
                : null;

        int checkInsThisWeek = 0;
        for (AppUser student : students) {
            checkInsThisWeek += (int) batch.countDoneInRange(student.getId(), weekStart, today);
        }

        LocalDateTime weekStartDateTime = weekStart.atStartOfDay();
        int newStudentsThisWeek = (int) students.stream()
                .filter(s -> s.getCreatedAt() != null && !s.getCreatedAt().isBefore(weekStartDateTime))
                .count();

        List<String> assumptions = new ArrayList<>();
        assumptions.add(String.format("%d aluno(s) ativo(s) (com matrícula ativa)", active.size()));
        assumptions.add(avgAdherence != null
                ? "Aderência média dos últimos 30 dias"
                : "Sem dados de aderência suficientes nos últimos 30 dias");
        assumptions.add(String.format("Check-ins contados desde %s (início da semana)", weekStart));

        return new CreatorOverviewResult(
                active.size(),
                avgAdherence,
                atRiskCount,
                checkInsThisWeek,
                newStudentsThisWeek,
                assumptions
        );
    }

    // ---------------------------------------------------------------------
    // 5.5b creatorAdherenceTrend
    // ---------------------------------------------------------------------

    private static final int TREND_WEEKS = 8;

    @Transactional(readOnly = true)
    public CreatorAdherenceTrendResult creatorAdherenceTrend(UUID creatorId) {
        LocalDate today = today();
        List<AppUser> active = activeStudents(creatorId);
        List<String> assumptions = new ArrayList<>();

        if (active.isEmpty()) {
            assumptions.add("Sem alunos ativos para calcular tendência");
            return new CreatorAdherenceTrendResult(null, null, null, List.of(), assumptions);
        }

        RetentionBatchContext batch = RetentionBatchContext.load(
                active, enrollmentRepository, workoutRepository, checkInRepository, today, properties);

        BigDecimal current = avgCommunityAdherence(active, batch, today.minusDays(29), today);
        BigDecimal previous = avgCommunityAdherence(active, batch, today.minusDays(59), today.minusDays(30));

        BigDecimal change = null;
        if (current != null && previous != null) {
            change = current.subtract(previous).setScale(PCT_SCALE, RoundingMode.HALF_EVEN);
        }

        LocalDate currentWeekStart = today.with(DayOfWeek.MONDAY);
        List<AdherenceTrendPoint> weeklySeries = new ArrayList<>();
        for (int i = TREND_WEEKS - 1; i >= 0; i--) {
            LocalDate weekStart = currentWeekStart.minusWeeks(i);
            LocalDate weekEnd = weekStart.plusDays(6);
            if (weekEnd.isAfter(today)) {
                weekEnd = today;
            }
            if (weekStart.isAfter(today)) {
                continue;
            }
            BigDecimal avg = avgCommunityAdherence(active, batch, weekStart, weekEnd);
            weeklySeries.add(new AdherenceTrendPoint(weekStart, avg));
        }

        assumptions.add("Aderência média da comunidade (alunos com matrícula ativa)");
        assumptions.add("Período atual: últimos 30 dias; anterior: 30 dias imediatamente anteriores");
        assumptions.add(String.format("Série semanal: %d semana(s) até %s", weeklySeries.size(), today));

        return new CreatorAdherenceTrendResult(current, previous, change, weeklySeries, assumptions);
    }

    // ---------------------------------------------------------------------
    // 5.5c creatorRanking
    // ---------------------------------------------------------------------

    @Transactional(readOnly = true)
    public CreatorRankingResult creatorRanking(UUID creatorId, RankingMetric metric, RankingPeriod period) {
        LocalDate today = today();
        LocalDate from = period == RankingPeriod.WEEK ? today.minusDays(6) : today.minusDays(29);
        List<AppUser> active = activeStudents(creatorId);

        List<String> assumptions = new ArrayList<>();
        assumptions.add(String.format("Ranking por %s", metric == RankingMetric.ADHERENCE ? "aderência" : "streak"));
        assumptions.add(period == RankingPeriod.WEEK
                ? String.format("Aderência calculada de %s a %s (7 dias)", from, today)
                : String.format("Aderência calculada de %s a %s (30 dias)", from, today));
        if (metric == RankingMetric.STREAK) {
            assumptions.add(String.format("Streak = dias consecutivos com check-in até %s (período não altera o streak)", today));
        }
        assumptions.add("Somente alunos com matrícula ativa");

        if (active.isEmpty()) {
            return new CreatorRankingResult(metric, period, List.of(), assumptions);
        }

        RetentionBatchContext batch = RetentionBatchContext.load(
                active, enrollmentRepository, workoutRepository, checkInRepository, today, properties);

        record Scored(AppUser student, BigDecimal value) {
        }

        List<Scored> scored = new ArrayList<>();
        for (AppUser student : active) {
            BigDecimal value = metric == RankingMetric.ADHERENCE
                    ? batch.adherenceRate(student.getId(), from, today)
                    : BigDecimal.valueOf(currentStreak(student.getId(), today));
            scored.add(new Scored(student, value));
        }

        scored.sort(Comparator
                .comparing(Scored::value, Comparator.nullsLast(Comparator.reverseOrder()))
                .thenComparing(s -> s.student().getName(), String.CASE_INSENSITIVE_ORDER));

        List<CreatorRankingEntry> entries = new ArrayList<>();
        int rank = 1;
        for (Scored row : scored) {
            entries.add(new CreatorRankingEntry(
                    rank++,
                    row.student().getId(),
                    row.student().getName(),
                    row.value()
            ));
        }

        return new CreatorRankingResult(metric, period, entries, assumptions);
    }

    private BigDecimal avgCommunityAdherence(
            List<AppUser> active,
            RetentionBatchContext batch,
            LocalDate from,
            LocalDate to
    ) {
        if (from.isAfter(to)) {
            return null;
        }
        BigDecimal sum = BigDecimal.ZERO;
        int counted = 0;
        for (AppUser student : active) {
            BigDecimal rate = batch.adherenceRate(student.getId(), from, to);
            if (rate != null) {
                sum = sum.add(rate);
                counted++;
            }
        }
        return counted > 0
                ? sum.divide(BigDecimal.valueOf(counted), PCT_SCALE, RoundingMode.HALF_EVEN)
                : null;
    }

    // ---------------------------------------------------------------------
    // 5.6 studentProgress
    // ---------------------------------------------------------------------

    @Transactional(readOnly = true)
    public StudentProgressResult studentProgress(UUID studentId) {
        AppUser student = userRepository.findById(studentId).orElse(null);
        String name = student != null ? student.getName() : "Aluno";
        LocalDate today = today();
        List<String> assumptions = new ArrayList<>();

        List<Enrollment> activeEnrollments = enrollmentRepository.findByStudentIdAndActiveTrue(studentId);
        if (activeEnrollments.isEmpty()) {
            assumptions.add("Sem matrícula ativa");
            return new StudentProgressResult(
                    studentId, name, false, null, 0, 0, null, null,
                    "Comece um programa para acompanhar seu progresso.", assumptions);
        }

        BigDecimal adherence = adherenceRate(studentId, today.minusDays(29), today);
        int weeklyDone = (int) checkInRepository.countByStudentIdAndStatusAndDateBetween(
                studentId, CheckInStatus.DONE, today.minusDays(6), today);
        int streak = currentStreak(studentId, today);
        Workout nextWorkout = nextWorkout(studentId, activeEnrollments);

        assumptions.add("Aderência dos últimos 30 dias");
        assumptions.add(String.format("Streak = dias consecutivos com check-in até %s", today));

        return new StudentProgressResult(
                studentId,
                name,
                true,
                adherence,
                streak,
                weeklyDone,
                nextWorkout != null ? nextWorkout.getId() : null,
                nextWorkout != null ? nextWorkout.getTitle() : null,
                "Continue treinando para manter seu streak!",
                assumptions
        );
    }

    // ---------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------

    private List<AppUser> activeStudents(UUID creatorId) {
        List<AppUser> students = userRepository.findByCreatorIdAndRole(creatorId, UserRole.STUDENT);
        if (students.isEmpty()) {
            return List.of();
        }
        Set<UUID> enrolledIds = enrollmentRepository.findByStudentIdInAndActiveTrue(
                        students.stream().map(AppUser::getId).toList()).stream()
                .map(Enrollment::getStudentId)
                .collect(Collectors.toSet());
        return students.stream()
                .filter(student -> enrolledIds.contains(student.getId()))
                .toList();
    }

    private long expectedWorkouts(UUID studentId, LocalDate from, LocalDate to) {
        if (from == null || to == null || from.isAfter(to)) {
            return 0;
        }
        BigDecimal expected = BigDecimal.ZERO;
        for (Enrollment enrollment : enrollmentRepository.findByStudentIdAndActiveTrue(studentId)) {
            long workoutCount = workoutRepository.countByProgramId(enrollment.getProgramId());
            if (workoutCount == 0) {
                continue;
            }
            LocalDate effectiveFrom = enrollment.getStartDate() != null && enrollment.getStartDate().isAfter(from)
                    ? enrollment.getStartDate()
                    : from;
            if (effectiveFrom.isAfter(to)) {
                continue;
            }
            long days = ChronoUnit.DAYS.between(effectiveFrom, to) + 1;
            // Plano semanal: workoutCount treinos esperados por semana.
            BigDecimal expectedForEnrollment = BigDecimal.valueOf(workoutCount)
                    .multiply(BigDecimal.valueOf(days))
                    .divide(BigDecimal.valueOf(7), 10, RoundingMode.HALF_EVEN);
            expected = expected.add(expectedForEnrollment);
        }
        return expected.setScale(0, RoundingMode.HALF_EVEN).longValueExact();
    }

    private Long enrollmentAgeDays(UUID studentId, LocalDate today) {
        LocalDate earliest = null;
        for (Enrollment enrollment : enrollmentRepository.findByStudentIdAndActiveTrue(studentId)) {
            LocalDate start = enrollment.getStartDate();
            if (start != null && (earliest == null || start.isBefore(earliest))) {
                earliest = start;
            }
        }
        if (earliest == null) {
            return null;
        }
        return Math.max(0, ChronoUnit.DAYS.between(earliest, today));
    }

    private int currentStreak(UUID studentId, LocalDate today) {
        Set<LocalDate> doneDates = new HashSet<>();
        for (CheckIn checkIn : checkInRepository.findByStudentIdOrderByDateDesc(studentId)) {
            if (checkIn.getStatus() == CheckInStatus.DONE) {
                doneDates.add(checkIn.getDate());
            }
        }
        if (doneDates.isEmpty()) {
            return 0;
        }

        LocalDate cursor = today;
        if (!doneDates.contains(cursor)) {
            cursor = today.minusDays(1);
            if (!doneDates.contains(cursor)) {
                return 0;
            }
        }

        int streak = 0;
        while (doneDates.contains(cursor)) {
            streak++;
            cursor = cursor.minusDays(1);
        }
        return streak;
    }

    private Workout nextWorkout(UUID studentId, List<Enrollment> activeEnrollments) {
        List<Workout> candidates = new ArrayList<>();
        for (Enrollment enrollment : activeEnrollments) {
            candidates.addAll(workoutRepository.findByProgramIdOrderByDayIndexAsc(enrollment.getProgramId()));
        }
        if (candidates.isEmpty()) {
            return null;
        }
        candidates.sort(Comparator.comparingInt(Workout::getDayIndex));

        Set<UUID> doneWorkoutIds = new HashSet<>();
        for (CheckIn checkIn : checkInRepository.findByStudentIdOrderByDateDesc(studentId)) {
            if (checkIn.getStatus() == CheckInStatus.DONE) {
                doneWorkoutIds.add(checkIn.getWorkoutId());
            }
        }

        for (Workout workout : candidates) {
            if (!doneWorkoutIds.contains(workout.getId())) {
                return workout;
            }
        }
        return candidates.get(0);
    }

    private RiskLevel levelFor(int score) {
        if (score >= properties.getHighThreshold()) {
            return RiskLevel.HIGH;
        }
        if (score >= properties.getMediumThreshold()) {
            return RiskLevel.MEDIUM;
        }
        return RiskLevel.LOW;
    }

    private BigDecimal clampPercent(BigDecimal value) {
        if (value.signum() < 0) {
            return BigDecimal.ZERO;
        }
        return value.min(HUNDRED);
    }

    private BigDecimal clampUnit(BigDecimal value) {
        if (value.signum() < 0) {
            return BigDecimal.ZERO;
        }
        return value.min(BigDecimal.ONE);
    }

    private int clampScore(int score) {
        return Math.max(0, Math.min(100, score));
    }

    private LocalDate today() {
        return LocalDate.now(clock);
    }
}
