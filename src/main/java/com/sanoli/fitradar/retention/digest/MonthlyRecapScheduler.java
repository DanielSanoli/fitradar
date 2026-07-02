package com.sanoli.fitradar.retention.digest;

import com.sanoli.fitradar.config.DigestProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;

@Component
public class MonthlyRecapScheduler {

    private static final Logger log = LoggerFactory.getLogger(MonthlyRecapScheduler.class);

    private final MonthlyRecapNotificationService notificationService;
    private final DigestProperties digestProperties;

    public MonthlyRecapScheduler(
            MonthlyRecapNotificationService notificationService,
            DigestProperties digestProperties
    ) {
        this.notificationService = notificationService;
        this.digestProperties = digestProperties;
    }

    @Scheduled(cron = "${app.digest.monthly-recap-cron:0 0 9 1 * *}", zone = "${app.retention.timezone:America/Sao_Paulo}")
    @SchedulerLock(name = "monthlyRecapPush", lockAtMostFor = "PT2H", lockAtLeastFor = "PT1M")
    public void monthlyRecapPush() {
        if (!digestProperties.isEnabled()) {
            return;
        }
        int sent = notificationService.sendMonthlyRecapPushes();
        log.info("Push de retrospectiva mensal enviado a {} aluno(s)", sent);
    }
}
