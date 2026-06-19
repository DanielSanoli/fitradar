package com.sanoli.fitradar.retention.digest;

import com.sanoli.fitradar.config.RetentionProperties;
import com.sanoli.fitradar.domain.AppUser;
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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Proatividade (retention.digest): resumo semanal ao criador e nudge ao aluno inativo.
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

    public RetentionDigestService(
            RetentionEngineService engine,
            NudgeService nudgeService,
            UserRepository userRepository,
            EmailService emailService,
            RetentionProperties retentionProperties
    ) {
        this.engine = engine;
        this.nudgeService = nudgeService;
        this.userRepository = userRepository;
        this.emailService = emailService;
        this.retentionProperties = retentionProperties;
    }

    @Transactional(readOnly = true)
    public int sendWeeklyDigests() {
        int sent = 0;
        int page = 0;
        Page<AppUser> creators;
        do {
            creators = userRepository.findByRole(UserRole.CREATOR, PageRequest.of(page++, CREATOR_PAGE_SIZE));
            for (AppUser creator : creators) {
                try {
                    if (sendWeeklyDigest(creator)) {
                        sent++;
                    }
                } catch (RuntimeException exception) {
                    log.warn("Falha ao enviar resumo semanal ao criador {}", creator.getId(), exception);
                }
            }
        } while (creators.hasNext());
        return sent;
    }

    public boolean sendWeeklyDigest(AppUser creator) {
        if (creator.getEmail() == null || creator.getEmail().isBlank()) {
            return false;
        }
        CreatorOverviewResult overview = engine.creatorOverview(creator.getId());
        List<ChurnRiskResult> atRisk = engine.studentsAtRisk(creator.getId(), RiskLevel.MEDIUM);
        String body = buildWeeklyBody(creator, overview, atRisk);
        emailService.sendWeeklyDigest(creator.getEmail(), "Seu resumo semanal do FitRadar", body);
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

    private String buildWeeklyBody(AppUser creator, CreatorOverviewResult overview, List<ChurnRiskResult> atRisk) {
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
