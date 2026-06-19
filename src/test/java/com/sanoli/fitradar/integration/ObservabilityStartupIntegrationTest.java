package com.sanoli.fitradar.integration;

import com.sanoli.fitradar.observability.RequestCorrelationFilter;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Garante que observabilidade opt-in (Sentry, métricas) não impede o startup sem config.
 */
class ObservabilityStartupIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    ApplicationContext applicationContext;

    @Test
    void contextLoadsWithoutSentryDsnOrMetrics() {
        assertThat(applicationContext.getBean(RequestCorrelationFilter.class)).isNotNull();
    }
}
