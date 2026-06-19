package com.sanoli.fitradar.retention.digest;

import com.sanoli.fitradar.config.DigestProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Dispara o resumo semanal ao criador e os nudges aos alunos inativos.
 */
@Component
public class RetentionDigestScheduler {

    private static final Logger log = LoggerFactory.getLogger(RetentionDigestScheduler.class);

    private final RetentionDigestService digestService;
    private final DigestProperties digestProperties;

    public RetentionDigestScheduler(RetentionDigestService digestService, DigestProperties digestProperties) {
        this.digestService = digestService;
        this.digestProperties = digestProperties;
    }

    @Scheduled(cron = "${app.digest.weekly-cron:0 0 8 * * MON}", zone = "${app.retention.timezone:America/Sao_Paulo}")
    public void weeklyDigest() {
        if (!digestProperties.isEnabled()) {
            return;
        }
        int sent = digestService.sendWeeklyDigests();
        log.info("Resumo semanal FitRadar enviado a {} criador(es)", sent);
    }

    @Scheduled(cron = "${app.digest.nudge-cron:0 0 9 * * *}", zone = "${app.retention.timezone:America/Sao_Paulo}")
    public void inactiveNudges() {
        if (!digestProperties.isEnabled()) {
            return;
        }
        int sent = digestService.sendInactiveNudges();
        log.info("Nudges FitRadar enviados a {} aluno(s) inativo(s)", sent);
    }
}
