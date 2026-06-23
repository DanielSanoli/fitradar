package com.sanoli.fitradar.retention.digest;

import com.sanoli.fitradar.config.RetentionProperties;
import com.sanoli.fitradar.domain.AppUser;
import com.sanoli.fitradar.domain.DigestFrequency;
import com.sanoli.fitradar.domain.RiskLevel;
import com.sanoli.fitradar.domain.UserRole;
import com.sanoli.fitradar.repository.UserRepository;
import com.sanoli.fitradar.retention.ai.NudgeService;
import com.sanoli.fitradar.retention.ai.NudgeSuggestion;
import com.sanoli.fitradar.retention.ai.RetentionAnswerComposer;
import com.sanoli.fitradar.retention.engine.ChurnRiskResult;
import com.sanoli.fitradar.retention.engine.CreatorOverviewResult;
import com.sanoli.fitradar.retention.engine.RetentionEngineService;
import com.sanoli.fitradar.service.EmailService;
import com.sanoli.fitradar.service.PushNotificationService;
import com.sanoli.fitradar.service.UserSettingsService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Proatividade (retention.digest): resumo ao criador e nudge ao aluno inativo.
 * Todo número vem do motor (Regra de Ouro); aqui só compomos texto e enviamos e-mail.
 */
@Service
public class RetentionDigestService {

    private static final Logger log = LoggerFactory.getLogger(RetentionDigestService.class);

    private static final int CREATOR_PAGE_SIZE = 50;
    private static final int STUDENT_PAGE_SIZE = 100;

    private final RetentionEngineService engine;
    private final NudgeService nudgeService;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final RetentionProperties retentionProperties;
    private final PushNotificationService pushNotificationService;
    private final UserSettingsService userSettingsService;

    public RetentionDigestService(
            RetentionEngineService engine,
            NudgeService nudgeService,
            UserRepository userRepository,
            EmailService emailService,
            RetentionProperties retentionProperties,
            PushNotificationService pushNotificationService,
            UserSettingsService userSettingsService
    ) {
        this.engine = engine;
        this.nudgeService = nudgeService;
        this.userRepository = userRepository;
        this.emailService = emailService;
        this.retentionProperties = retentionProperties;
        this.pushNotificationService = pushNotificationService;
        this.userSettingsService = userSettingsService;
    }

    @Transactional(readOnly = true)
    public int sendDigestsForFrequency(DigestFrequency targetFrequency) {
        int sent = 0;
        int page = 0;
        Page<AppUser> creators;
        do {
            creators = userRepository.findByRole(UserRole.CREATOR, PageRequest.of(page++, CREATOR_PAGE_SIZE));
            for (AppUser creator : creators) {
                try {
                    DigestFrequency pref = userSettingsService.digestFrequencyFor(creator.getId());
                    if (pref == DigestFrequency.NONE || pref != targetFrequency) {
                        continue;
                    }
                    if (sendWeeklyDigest(creator, targetFrequency)) {
                        sent++;
                    }
                } catch (RuntimeException exception) {
                    log.warn("Falha ao enviar resumo ao criador {}", creator.getId(), exception);
                }
            }
        } while (creators.hasNext());
        return sent;
    }

    @Transactional(readOnly = true)
    public int sendWeeklyDigests() {
        return sendDigestsForFrequency(DigestFrequency.WEEKLY);
    }

    public boolean sendWeeklyDigest(AppUser creator, DigestFrequency frequency) {
        if (creator.getEmail() == null || creator.getEmail().isBlank()) {
            return false;
        }
        CreatorOverviewResult overview = engine.creatorOverview(creator.getId());
        List<ChurnRiskResult> atRisk = engine.studentsAtRisk(creator.getId(), RiskLevel.MEDIUM);
        String body = buildCreatorDigestBody(creator, overview, atRisk);
        String subject = frequency == DigestFrequency.DAILY
                ? "Seu resumo diário do FitRadar"
                : "Seu resumo semanal do FitRadar";
        emailService.sendWeeklyDigest(creator.getEmail(), subject, body);
        return true;
    }

    @Transactional(readOnly = true)
    public int sendInactiveNudges() {
        int sent = 0;
        int threshold = retentionProperties.getInactiveAlertDays();
        int creatorPage = 0;
        Page<AppUser> creators;
        do {
            creators = userRepository.findByRole(UserRole.CREATOR, PageRequest.of(creatorPage++, CREATOR_PAGE_SIZE));
            for (AppUser creator : creators) {
                int studentPage = 0;
                Page<AppUser> students;
                do {
                    students = userRepository.findByCreatorIdAndRole(
                            creator.getId(), UserRole.STUDENT, PageRequest.of(studentPage++, STUDENT_PAGE_SIZE));
                    for (AppUser student : students) {
                        try {
                            Long daysInactive = engine.daysSinceLastActivity(student.getId());
                            if (daysInactive != null && daysInactive > threshold
                                    && student.getEmail() != null && !student.getEmail().isBlank()) {
                                NudgeSuggestion nudge = nudgeService.buildNudge(student.getId());
                                String body = nudge.message() + "\n\n— " + creator.getName();
                                emailService.sendStudentNudge(student.getEmail(), "Senti sua falta nos treinos 💪", body);
                                try {
                                    pushNotificationService.sendToUser(
                                            student.getId(),
                                            "Senti sua falta nos treinos 💪",
                                            nudge.message(),
                                            "/student"
                                    );
                                } catch (RuntimeException pushEx) {
                                    log.warn("Falha push nudge aluno {}", student.getId(), pushEx);
                                }
                                sent++;
                            }
                        } catch (RuntimeException exception) {
                            log.warn("Falha ao enviar nudge ao aluno {}", student.getId(), exception);
                        }
                    }
                } while (students.hasNext());
            }
        } while (creators.hasNext());
        return sent;
    }

    private String buildCreatorDigestBody(AppUser creator, CreatorOverviewResult overview, List<ChurnRiskResult> atRisk) {
        StringBuilder body = new StringBuilder();
        body.append("Olá, ").append(creator.getName()).append("!\n\n");
        body.append("Resumo da sua comunidade no FitRadar:\n");
        body.append("- Alunos ativos: ").append(overview.activeStudents()).append("\n");
        body.append("- Aderência média: ")
                .append(overview.avgAdherence() != null ? overview.avgAdherence().toPlainString() + "%" : "sem dados")
                .append("\n");
        body.append("- Alunos em risco: ").append(overview.atRiskCount()).append("\n");
        body.append("- Check-ins na semana: ").append(overview.checkInsThisWeek()).append("\n");
        body.append("- Novos alunos na semana: ").append(overview.newStudentsThisWeek()).append("\n\n");

        if (atRisk.isEmpty()) {
            body.append("Nenhum aluno em risco no momento. Continue o ótimo trabalho!\n\n");
        } else {
            body.append("Alunos que merecem sua atenção:\n");
            atRisk.stream().limit(5).forEach(r ->
                    body.append("- ").append(r.studentName())
                            .append(" (risco ").append(r.level())
                            .append(", score ").append(r.score()).append(")\n"));
            body.append("\nAção sugerida: fale hoje com os alunos de risco ALTO e envie um lembrete aos demais.\n\n");
        }

        body.append(RetentionAnswerComposer.DISCLAIMER);
        return body.toString();
    }
}
