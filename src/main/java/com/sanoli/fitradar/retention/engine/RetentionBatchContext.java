package com.sanoli.fitradar.retention.engine;

import com.sanoli.fitradar.config.RetentionProperties;
import com.sanoli.fitradar.domain.AppUser;
import com.sanoli.fitradar.domain.CheckIn;
import com.sanoli.fitradar.domain.CheckInStatus;
import com.sanoli.fitradar.domain.Enrollment;
import com.sanoli.fitradar.domain.RiskLevel;
import com.sanoli.fitradar.repository.CheckInRepository;
import com.sanoli.fitradar.repository.EnrollmentRepository;
import com.sanoli.fitradar.repository.WorkoutRepository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Pré-carrega matrículas, check-ins e contagens de treinos em lote para evitar N+1
 * em studentsAtRisk e creatorOverview.
 */
final class RetentionBatchContext {

    private static final BigDecimal HUNDRED = new BigDecimal("100");
    private static final int PCT_SCALE = 2;

    private final Map<UUID, AppUser> studentsById;
    private final Map<UUID, List<Enrollment>> enrollmentsByStudent;
    private final Map<UUID, Long> workoutCountByProgram;
    private final Map<UUID, LocalDate> lastActivityByStudent;
    private final Map<UUID, List<LocalDate>> doneDatesByStudent;
    private final RetentionProperties properties;

    private RetentionBatchContext(
            Map<UUID, AppUser> studentsById,
            Map<UUID, List<Enrollment>> enrollmentsByStudent,
            Map<UUID, Long> workoutCountByProgram,
            Map<UUID, LocalDate> lastActivityByStudent,
            Map<UUID, List<LocalDate>> doneDatesByStudent,
            RetentionProperties properties
    ) {
        this.studentsById = studentsById;
        this.enrollmentsByStudent = enrollmentsByStudent;
        this.workoutCountByProgram = workoutCountByProgram;
        this.lastActivityByStudent = lastActivityByStudent;
        this.doneDatesByStudent = doneDatesByStudent;
        this.properties = properties;
    }

    static RetentionBatchContext load(
            List<AppUser> students,
            EnrollmentRepository enrollmentRepository,
            WorkoutRepository workoutRepository,
            CheckInRepository checkInRepository,
            LocalDate today,
            RetentionProperties properties
    ) {
        if (students.isEmpty()) {
            return empty(properties);
        }

        List<UUID> studentIds = students.stream().map(AppUser::getId).toList();
        Map<UUID, AppUser> studentsById = students.stream()
                .collect(Collectors.toMap(AppUser::getId, s -> s));

        List<Enrollment> allEnrollments = enrollmentRepository.findByStudentIdInAndActiveTrue(studentIds);
        Map<UUID, List<Enrollment>> enrollmentsByStudent = allEnrollments.stream()
                .collect(Collectors.groupingBy(Enrollment::getStudentId));

        List<UUID> programIds = allEnrollments.stream()
                .map(Enrollment::getProgramId)
                .distinct()
                .toList();
        Map<UUID, Long> workoutCountByProgram = loadWorkoutCounts(workoutRepository, programIds);

        LocalDate loadFrom = today.minusDays(30);
        Map<UUID, LocalDate> lastActivityByStudent = toMaxDateMap(
                checkInRepository.findMaxDateByStudentIdIn(studentIds));
        Map<UUID, List<LocalDate>> doneDatesByStudent = loadDoneDates(
                checkInRepository.findByStudentIdInAndStatusAndDateBetween(
                        studentIds, CheckInStatus.DONE, loadFrom, today));

        return new RetentionBatchContext(
                studentsById,
                enrollmentsByStudent,
                workoutCountByProgram,
                lastActivityByStudent,
                doneDatesByStudent,
                properties
        );
    }

    List<AppUser> students() {
        return new ArrayList<>(studentsById.values());
    }

    ChurnRiskResult churnRisk(UUID studentId, LocalDate today) {
        AppUser student = studentsById.get(studentId);
        String name = student != null ? student.getName() : "Aluno";
        List<String> assumptions = new ArrayList<>();

        Long daysInactive = daysSinceLastActivity(studentId, today);
        Long enrollmentAgeDays = enrollmentAgeDays(studentId, today);
        boolean hasAnyCheckIn = daysInactive != null;

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

    BigDecimal adherenceRate(UUID studentId, LocalDate from, LocalDate to) {
        long expected = expectedWorkouts(studentId, from, to);
        if (expected <= 0) {
            return null;
        }
        long done = countDone(studentId, from, to);
        BigDecimal rate = BigDecimal.valueOf(done)
                .divide(BigDecimal.valueOf(expected), 10, RoundingMode.HALF_EVEN)
                .multiply(HUNDRED);
        return clampPercent(rate).setScale(PCT_SCALE, RoundingMode.HALF_EVEN);
    }

    long countDoneInRange(UUID studentId, LocalDate from, LocalDate to) {
        return countDone(studentId, from, to);
    }

    private long countDone(UUID studentId, LocalDate from, LocalDate to) {
        return doneDatesByStudent.getOrDefault(studentId, List.of()).stream()
                .filter(date -> !date.isBefore(from) && !date.isAfter(to))
                .count();
    }

    private Long daysSinceLastActivity(UUID studentId, LocalDate today) {
        LocalDate last = lastActivityByStudent.get(studentId);
        if (last == null) {
            return null;
        }
        return ChronoUnit.DAYS.between(last, today);
    }

    private Long enrollmentAgeDays(UUID studentId, LocalDate today) {
        LocalDate earliest = null;
        for (Enrollment enrollment : enrollmentsByStudent.getOrDefault(studentId, List.of())) {
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

    private long expectedWorkouts(UUID studentId, LocalDate from, LocalDate to) {
        if (from == null || to == null || from.isAfter(to)) {
            return 0;
        }
        BigDecimal expected = BigDecimal.ZERO;
        for (Enrollment enrollment : enrollmentsByStudent.getOrDefault(studentId, List.of())) {
            long workoutCount = workoutCountByProgram.getOrDefault(enrollment.getProgramId(), 0L);
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
            BigDecimal expectedForEnrollment = BigDecimal.valueOf(workoutCount)
                    .multiply(BigDecimal.valueOf(days))
                    .divide(BigDecimal.valueOf(7), 10, RoundingMode.HALF_EVEN);
            expected = expected.add(expectedForEnrollment);
        }
        return expected.setScale(0, RoundingMode.HALF_EVEN).longValueExact();
    }

    private static RetentionBatchContext empty(RetentionProperties properties) {
        return new RetentionBatchContext(
                Map.of(), Map.of(), Map.of(), Map.of(), Map.of(), properties);
    }

    private static Map<UUID, Long> loadWorkoutCounts(WorkoutRepository workoutRepository, List<UUID> programIds) {
        if (programIds.isEmpty()) {
            return Map.of();
        }
        Map<UUID, Long> counts = new HashMap<>();
        for (Object[] row : workoutRepository.countGroupByProgramIdIn(programIds)) {
            counts.put((UUID) row[0], (Long) row[1]);
        }
        return counts;
    }

    private static Map<UUID, LocalDate> toMaxDateMap(List<Object[]> rows) {
        Map<UUID, LocalDate> map = new HashMap<>();
        for (Object[] row : rows) {
            map.put((UUID) row[0], (LocalDate) row[1]);
        }
        return map;
    }

    private static Map<UUID, List<LocalDate>> loadDoneDates(List<CheckIn> checkIns) {
        Map<UUID, List<LocalDate>> map = new HashMap<>();
        for (CheckIn checkIn : checkIns) {
            map.computeIfAbsent(checkIn.getStudentId(), ignored -> new ArrayList<>())
                    .add(checkIn.getDate());
        }
        return map;
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

    private static BigDecimal clampPercent(BigDecimal value) {
        if (value.signum() < 0) {
            return BigDecimal.ZERO;
        }
        return value.min(HUNDRED);
    }

    private static BigDecimal clampUnit(BigDecimal value) {
        if (value.signum() < 0) {
            return BigDecimal.ZERO;
        }
        return value.min(BigDecimal.ONE);
    }

    private static int clampScore(int score) {
        return Math.max(0, Math.min(100, score));
    }
}
