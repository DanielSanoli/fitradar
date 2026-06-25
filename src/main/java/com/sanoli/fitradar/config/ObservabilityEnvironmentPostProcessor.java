package com.sanoli.fitradar.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.util.HashMap;
import java.util.Map;

/**
 * Ativa profile {@code prod} (logs JSON) e exposição de métricas quando configurado por env.
 */
public class ObservabilityEnvironmentPostProcessor implements EnvironmentPostProcessor {

    private static final String SOURCE = "fitradarObservability";

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        Map<String, Object> properties = new HashMap<>();

        if (isTrue(environment.getProperty("APP_PRODUCTION"))
                || isTrue(environment.getProperty("app.runtime.production"))) {
            appendActiveProfile(environment, "prod");
        }

        if (isTrue(environment.getProperty("METRICS_ENABLED"))
                || isTrue(environment.getProperty("app.observability.metrics-enabled"))) {
            properties.put("management.endpoints.web.exposure.include", "health,prometheus");
            properties.put("management.prometheus.metrics.export.enabled", "true");
        }

        if (!properties.isEmpty()) {
            environment.getPropertySources().addFirst(new MapPropertySource(SOURCE, properties));
        }
    }

    private static void appendActiveProfile(ConfigurableEnvironment environment, String profile) {
        String existing = environment.getProperty("spring.profiles.active", "");
        if (existing.contains(profile)) {
            return;
        }
        String updated = existing.isBlank() ? profile : existing + "," + profile;
        environment.getPropertySources().addFirst(
                new MapPropertySource(SOURCE + "Profiles", Map.of("spring.profiles.active", updated)));
    }

    private static boolean isTrue(String value) {
        return value != null && (value.equalsIgnoreCase("true") || value.equals("1"));
    }
}
