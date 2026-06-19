package com.sanoli.fitradar.retention.rules;

import com.sanoli.fitradar.domain.AppUser;
import com.sanoli.fitradar.domain.UserRole;
import com.sanoli.fitradar.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Avalia diariamente as regras de retenção para todos os criadores.
 */
@Component
public class RetentionAlertScheduler {

    private static final Logger log = LoggerFactory.getLogger(RetentionAlertScheduler.class);

    private final RetentionRuleEngine ruleEngine;
    private final UserRepository userRepository;

    public RetentionAlertScheduler(RetentionRuleEngine ruleEngine, UserRepository userRepository) {
        this.ruleEngine = ruleEngine;
        this.userRepository = userRepository;
    }

    @Scheduled(cron = "${app.retention.alerts-cron:0 0 8 * * *}", zone = "${app.retention.timezone:America/Sao_Paulo}")
    public void evaluateAllCreators() {
        for (AppUser creator : userRepository.findByRole(UserRole.CREATOR)) {
            try {
                ruleEngine.evaluateCreator(creator.getId());
            } catch (RuntimeException exception) {
                log.warn("Falha ao avaliar regras de retenção para o criador {}", creator.getId());
            }
        }
    }
}
