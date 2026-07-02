package com.sanoli.fitradar.service;

import com.sanoli.fitradar.config.RetentionProperties;
import com.sanoli.fitradar.domain.AppUser;
import com.sanoli.fitradar.domain.BadgeType;
import com.sanoli.fitradar.domain.CheckInStatus;
import com.sanoli.fitradar.domain.CreatorSpace;
import com.sanoli.fitradar.domain.StudentBadge;
import com.sanoli.fitradar.dto.BadgeResponse;
import com.sanoli.fitradar.dto.MonthlyRecapBranding;
import com.sanoli.fitradar.dto.MonthlyRecapComparison;
import com.sanoli.fitradar.dto.MonthlyRecapResult;
import com.sanoli.fitradar.exception.BusinessException;
import com.sanoli.fitradar.repository.CheckInRepository;
import com.sanoli.fitradar.repository.CreatorSpaceRepository;
import com.sanoli.fitradar.repository.StudentBadgeRepository;
import com.sanoli.fitradar.retention.engine.AdherenceResult;
import com.sanoli.fitradar.retention.engine.RetentionEngineService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.TreeSet;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class MonthlyRecapService {

    static final int XP_PER_WORKOUT = 10;

    private static final DateTimeFormatter MONTH_LABEL =
            DateTimeFormatter.ofPattern("MMMM 'de' yyyy", Locale.forLanguageTag("pt-BR"));

    private final RetentionEngineService retentionEngineService;
    private final CheckInRepository checkInRepository;
    private final StudentBadgeRepository badgeRepository;
    private final CreatorSpaceRepository creatorSpaceRepository;
    private final Clock clock;
    private final ZoneId zoneId;

    public MonthlyRecapService(
            RetentionEngineService retentionEngineService,
            CheckInRepository checkInRepository,
            StudentBadgeRepository badgeRepository,
            CreatorSpaceRepository creatorSpaceRepository,
            Clock clock,
            RetentionProperties retentionProperties
    ) {
        this.retentionEngineService = retentionEngineService;
        this.checkInRepository = checkInRepository;
        this.badgeRepository = badgeRepository;
        this.creatorSpaceRepository = creatorSpaceRepository;
        this.clock = clock;
        this.zoneId = ZoneId.of(retentionProperties.getTimezone());
    }

    @Transactional(readOnly = true)
    public MonthlyRecapResult recapForStudent(AppUser student, int year, int month) {
        validateClosedMonth(year, month);

        UUID studentId = student.getId();
        YearMonth target = YearMonth.of(year, month);
        LocalDate from = target.atDay(1);
        LocalDate to = target.atEndOfMonth();

        long workoutsDone = checkInRepository.countByStudentIdAndStatusAndDateBetween(
                studentId, CheckInStatus.DONE, from, to);

        AdherenceResult adherenceDetail = retentionEngineService.adherenceDetail(studentId, from, to);
        Set<LocalDate> doneDates = checkInRepository
                .findByStudentIdAndStatusAndDateBetween(studentId, CheckInStatus.DONE, from, to)
                .stream()
                .map(checkIn -> checkIn.getDate())
                .collect(Collectors.toCollection(TreeSet::new));

        int longestStreak = longestStreakInRange(doneDates, from, to);
        int xpEarned = Math.toIntExact(workoutsDone * XP_PER_WORKOUT);
        BadgeResponse highlightBadge = highlightBadgeInMonth(studentId, from, to);

        YearMonth previous = target.minusMonths(1);
        MonthlyRecapComparison comparison = buildComparison(studentId, previous, workoutsDone, adherenceDetail.rate(), longestStreak);

        List<String> assumptions = new ArrayList<>();
        assumptions.add(String.format("Treinos = check-ins DONE entre %s e %s", from, to));
        assumptions.add(String.format("XP = %d pontos por treino concluído no mês", XP_PER_WORKOUT));
        assumptions.add("Maior streak do mês = maior sequência de dias consecutivos com treino no período");
        if (adherenceDetail.assumptions() != null) {
            assumptions.addAll(adherenceDetail.assumptions());
        }

        return new MonthlyRecapResult(
                year,
                month,
                capitalize(MONTH_LABEL.format(target.atDay(1))),
                workoutsDone > 0,
                workoutsDone,
                adherenceDetail.rate(),
                longestStreak,
                xpEarned,
                highlightBadge,
                comparison,
                brandingFor(student),
                assumptions
        );
    }

    public YearMonth previousClosedMonth() {
        return YearMonth.from(LocalDate.now(clock).minusMonths(1));
    }

    public String monthLabelFor(YearMonth month) {
        return capitalize(MONTH_LABEL.format(month.atDay(1)));
    }

    private MonthlyRecapComparison buildComparison(
            UUID studentId,
            YearMonth previous,
            long currentWorkouts,
            BigDecimal currentAdherence,
            int currentLongestStreak
    ) {
        LocalDate prevFrom = previous.atDay(1);
        LocalDate prevTo = previous.atEndOfMonth();

        long prevWorkouts = checkInRepository.countByStudentIdAndStatusAndDateBetween(
                studentId, CheckInStatus.DONE, prevFrom, prevTo);

        if (prevWorkouts == 0 && currentWorkouts == 0) {
            return new MonthlyRecapComparison(null, null, null);
        }

        Long workoutsDelta = currentWorkouts - prevWorkouts;

        BigDecimal adherenceDelta = null;
        AdherenceResult prevAdherence = retentionEngineService.adherenceDetail(studentId, prevFrom, prevTo);
        if (currentAdherence != null && prevAdherence.rate() != null) {
            adherenceDelta = currentAdherence.subtract(prevAdherence.rate()).setScale(2, RoundingMode.HALF_EVEN);
        }

        Set<LocalDate> prevDoneDates = checkInRepository
                .findByStudentIdAndStatusAndDateBetween(studentId, CheckInStatus.DONE, prevFrom, prevTo)
                .stream()
                .map(checkIn -> checkIn.getDate())
                .collect(Collectors.toCollection(TreeSet::new));
        int prevLongest = longestStreakInRange(prevDoneDates, prevFrom, prevTo);
        Integer streakDelta = prevWorkouts > 0 || currentWorkouts > 0
                ? currentLongestStreak - prevLongest
                : null;

        return new MonthlyRecapComparison(workoutsDelta, adherenceDelta, streakDelta);
    }

    private BadgeResponse highlightBadgeInMonth(UUID studentId, LocalDate from, LocalDate to) {
        Instant start = from.atStartOfDay(zoneId).toInstant();
        Instant end = to.plusDays(1).atStartOfDay(zoneId).toInstant();

        List<StudentBadge> badges = badgeRepository.findByStudentIdAndEarnedAtBetween(studentId, start, end);
        if (badges.isEmpty()) {
            return null;
        }

        return badges.stream()
                .max(Comparator
                        .comparingInt((StudentBadge badge) -> badgePriority(badge.getBadgeType()))
                        .thenComparing(StudentBadge::getEarnedAt))
                .map(BadgeResponse::fromEntity)
                .orElse(null);
    }

    private int badgePriority(BadgeType type) {
        return switch (type) {
            case CHECKINS_50 -> 4;
            case STREAK_30 -> 3;
            case STREAK_7 -> 2;
            case FIRST_CHECKIN -> 1;
        };
    }

    static int longestStreakInRange(Set<LocalDate> doneDates, LocalDate from, LocalDate to) {
        if (doneDates.isEmpty()) {
            return 0;
        }
        int max = 0;
        LocalDate cursor = from;
        while (!cursor.isAfter(to)) {
            if (!doneDates.contains(cursor)) {
                cursor = cursor.plusDays(1);
                continue;
            }
            int run = 0;
            LocalDate day = cursor;
            while (!day.isAfter(to) && doneDates.contains(day)) {
                run++;
                day = day.plusDays(1);
            }
            max = Math.max(max, run);
            cursor = day;
        }
        return max;
    }

    private MonthlyRecapBranding brandingFor(AppUser student) {
        if (student.getCreatorId() == null) {
            return new MonthlyRecapBranding("FitRadar", null, null);
        }
        CreatorSpace space = creatorSpaceRepository.findByCreatorId(student.getCreatorId()).orElse(null);
        if (space == null) {
            return new MonthlyRecapBranding("FitRadar", null, null);
        }
        return new MonthlyRecapBranding(
                space.getName(),
                space.getLogoUrl(),
                space.getPrimaryColor()
        );
    }

    private void validateClosedMonth(int year, int month) {
        if (month < 1 || month > 12) {
            throw new BusinessException("Mês inválido");
        }
        if (year < 2000 || year > 2100) {
            throw new BusinessException("Ano inválido");
        }
        YearMonth requested = YearMonth.of(year, month);
        YearMonth current = YearMonth.from(LocalDate.now(clock));
        if (!requested.isBefore(current)) {
            throw new BusinessException("A retrospectiva só está disponível para meses encerrados");
        }
    }

    private static String capitalize(String text) {
        if (text == null || text.isBlank()) {
            return text;
        }
        return text.substring(0, 1).toUpperCase(Locale.ROOT) + text.substring(1);
    }
}
