package com.sanoli.fitradar.retention.rules;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sanoli.fitradar.config.RetentionProperties;
import com.sanoli.fitradar.domain.Alert;
import com.sanoli.fitradar.domain.AlertType;
import com.sanoli.fitradar.domain.AppUser;
import com.sanoli.fitradar.domain.Enrollment;
import com.sanoli.fitradar.domain.RiskLevel;
import com.sanoli.fitradar.domain.Severity;
import com.sanoli.fitradar.domain.UserRole;
import com.sanoli.fitradar.repository.AlertRepository;
import com.sanoli.fitradar.repository.EnrollmentRepository;
import com.sanoli.fitradar.repository.UserRepository;
import com.sanoli.fitradar.retention.engine.ChurnRiskResult;
import com.sanoli.fitradar.retention.engine.RetentionEngineService;
import com.sanoli.fitradar.retention.engine.StudentProgressResult;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Motor de regras (camada retention.rules). Consome os DTOs do motor (não recalcula)
 * e gera {@link Alert}, deduplicando por (criador, aluno, tipo) no mesmo dia.
 */
@Service
public class RetentionRuleEngine {

    private final RetentionEngineService engine;
    private final AlertRepository alertRepository;
    private final UserRepository userRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final RetentionProperties properties;
    private final ObjectMapper objectMapper;
    private final Clock clock;

    public RetentionRuleEngine(
            RetentionEngineService engine,
            AlertRepository alertRepository,
            UserRepository userRepository,
            EnrollmentRepository enrollmentRepository,
            RetentionProperties properties,
            ObjectMapper objectMapper,
            Clock clock
    ) {
        this.engine = engine;
        this.alertRepository = alertRepository;
        this.userRepository = userRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.properties = properties;
        this.objectMapper = objectMapper;
        this.clock = clock;
    }

    @Transactional
    public List<Alert> evaluateCreator(UUID creatorId) {
        List<AppUser> students = userRepository.findByCreatorIdAndRole(creatorId, UserRole.STUDENT);
        if (students.isEmpty()) {
            return List.of();
        }
        Set<UUID> enrolledIds = enrollmentRepository.findByStudentIdInAndActiveTrue(
                        students.stream().map(AppUser::getId).toList()).stream()
                .map(Enrollment::getStudentId)
                .collect(Collectors.toSet());

        List<Alert> created = new ArrayList<>();
        for (AppUser student : students) {
            if (!enrolledIds.contains(student.getId())) {
                continue;
            }
            try {
                created.addAll(evaluateStudent(creatorId, student));
            } catch (RuntimeException exception) {
                // Isola falha por aluno — não derruba a rodada do criador.
            }
        }
        return created;
    }

    private List<Alert> evaluateStudent(UUID creatorId, AppUser student) {
        List<Alert> created = new ArrayList<>();
        UUID studentId = student.getId();
        String name = student.getName();
        LocalDate today = LocalDate.now(clock);

        Long daysInactive = engine.daysSinceLastActivity(studentId);
        if (daysInactive != null && daysInactive > properties.getInactiveAlertDays()) {
            persistIfNew(created, creatorId, studentId, AlertType.STUDENT_INACTIVE, Severity.WARNING,
                    String.format("%s está inativo há %d dias", name, daysInactive),
                    "Enviar lembrete para " + name,
                    Map.of("daysInactive", daysInactive));
        }

        ChurnRiskResult risk = engine.churnRiskScore(studentId);
        if (risk.level() == RiskLevel.HIGH) {
            persistIfNew(created, creatorId, studentId, AlertType.CHURN_RISK_HIGH, Severity.CRITICAL,
                    String.format("%s com risco ALTO de desistência (score %d)", name, risk.score()),
                    "Falar com " + name + " hoje",
                    Map.of("score", risk.score(), "level", risk.level().name()));
        }

        BigDecimal recent = engine.adherenceRate(studentId, today.minusDays(6), today);
        BigDecimal previous = engine.adherenceRate(studentId, today.minusDays(13), today.minusDays(7));
        if (recent != null && previous != null) {
            BigDecimal drop = previous.subtract(recent);
            if (drop.compareTo(new BigDecimal("30")) > 0) {
                persistIfNew(created, creatorId, studentId, AlertType.ADHERENCE_DROP, Severity.WARNING,
                        String.format("Aderência de %s caiu de %s%% para %s%%", name,
                                previous.toPlainString(), recent.toPlainString()),
                        "Aderência caindo — cheque o programa de " + name,
                        Map.of("previous", previous, "recent", recent));
            }
        }

        StudentProgressResult progress = engine.studentProgress(studentId);
        if (progress.currentStreak() == 7 || progress.currentStreak() == 30) {
            persistIfNew(created, creatorId, studentId, AlertType.POSITIVE_STREAK, Severity.INFO,
                    String.format("%s atingiu %d dias seguidos de treino!", name, progress.currentStreak()),
                    "Parabenize " + name,
                    Map.of("streak", progress.currentStreak()));
        }

        return created;
    }

    private void persistIfNew(
            List<Alert> created,
            UUID creatorId,
            UUID studentId,
            AlertType type,
            Severity severity,
            String message,
            String actionSuggestion,
            Map<String, ?> snapshot
    ) {
        Instant startOfDay = LocalDate.now(clock).atStartOfDay(clock.getZone()).toInstant();
        if (alertRepository.existsByRecipientUserIdAndSubjectStudentIdAndTypeAndCreatedAtAfter(
                creatorId, studentId, type, startOfDay)) {
            return;
        }

        Alert alert = new Alert();
        alert.setRecipientUserId(creatorId);
        alert.setSubjectStudentId(studentId);
        alert.setType(type);
        alert.setSeverity(severity);
        alert.setMessage(message);
        alert.setActionSuggestion(actionSuggestion);
        alert.setDataSnapshot(toJson(snapshot));
        created.add(alertRepository.save(alert));
    }

    private String toJson(Map<String, ?> snapshot) {
        try {
            return objectMapper.writeValueAsString(snapshot);
        } catch (JsonProcessingException exception) {
            return null;
        }
    }
}
