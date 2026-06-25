package com.sanoli.fitradar.config;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.Arrays;
import java.util.List;

/**
 * Fail-fast de configuração: impede produção (e billing habilitado) sem segredos obrigatórios.
 * Nunca loga valores de segredos.
 */
@Component
public class ProductionStartupValidator {

    private static final Logger log = LoggerFactory.getLogger(ProductionStartupValidator.class);
    private static final String DEFAULT_JWT = "fitradar-dev-secret-please-change-this-to-a-long-random-value";
    private static final int MIN_JWT_LENGTH = 32;

    private final Environment environment;
    private final AppRuntimeProperties runtimeProperties;
    private final BillingProperties billingProperties;
    private final CopilotProperties copilotProperties;
    private final CorsProperties corsProperties;
    private final ObservabilityProperties observabilityProperties;

    public ProductionStartupValidator(
            Environment environment,
            AppRuntimeProperties runtimeProperties,
            BillingProperties billingProperties,
            CopilotProperties copilotProperties,
            CorsProperties corsProperties,
            ObservabilityProperties observabilityProperties
    ) {
        this.environment = environment;
        this.runtimeProperties = runtimeProperties;
        this.billingProperties = billingProperties;
        this.copilotProperties = copilotProperties;
        this.corsProperties = corsProperties;
        this.observabilityProperties = observabilityProperties;
    }

    @PostConstruct
    void validate() {
        boolean production = isProductionProfile();
        rejectWildcardCors();
        warnIfWeakJwt(!production);

        if (billingProperties.isBillingEnabled()) {
            requireAsaasApiKey();
            requireAsaasBaseUrl();
            requireBillingWebhook();
        }

        if (production) {
            requireStrongJwt();
            requireMetricsTokenWhenEnabled();
            if (copilotProperties.isEnabled()) {
                requireOpenAiKey();
            }
        }

        warnIfSandboxAsaas();
        warnIfLocalhostCorsInProduction(production);
    }

    private boolean isProductionProfile() {
        return runtimeProperties.isProduction()
                || Arrays.asList(environment.getActiveProfiles()).contains("prod");
    }

    private void rejectWildcardCors() {
        for (String origin : corsProperties.getAllowedOrigins()) {
            if ("*".equals(origin != null ? origin.trim() : null)) {
                throw new IllegalStateException(
                        "CORS_ALLOWED_ORIGINS não pode conter '*' — liste origens explícitas.");
            }
        }
    }

    private void warnIfWeakJwt(boolean devMode) {
        if (!isWeakJwt()) {
            return;
        }
        if (devMode) {
            log.warn("JWT_SECRET usa valor padrão de desenvolvimento — troque antes do go-live.");
        }
    }

    private void requireStrongJwt() {
        if (isWeakJwt()) {
            throw new IllegalStateException(
                    "Produção exige JWT_SECRET com pelo menos " + MIN_JWT_LENGTH + " caracteres (valor forte e único).");
        }
    }

    private boolean isWeakJwt() {
        String secret = environment.getProperty("app.security.jwt.secret", DEFAULT_JWT);
        return !StringUtils.hasText(secret)
                || secret.length() < MIN_JWT_LENGTH
                || DEFAULT_JWT.equals(secret);
    }

    private void requireAsaasApiKey() {
        String apiKey = billingProperties.getAsaas().getApiKey();
        if (!StringUtils.hasText(apiKey)) {
            throw new IllegalStateException(
                    "ASAAS_ENABLED=true exige ASAAS_API_KEY configurada.");
        }
    }

    private void requireAsaasBaseUrl() {
        String baseUrl = billingProperties.getAsaas().getBaseUrl();
        if (!StringUtils.hasText(baseUrl)) {
            throw new IllegalStateException(
                    "ASAAS_ENABLED=true exige ASAAS_BASE_URL configurada.");
        }
    }

    private void requireBillingWebhook() {
        String token = billingProperties.getAsaas().getWebhookToken();
        if (!StringUtils.hasText(token)) {
            throw new IllegalStateException(
                    "ASAAS_ENABLED=true exige ASAAS_WEBHOOK_TOKEN configurado.");
        }
    }

    private void requireMetricsTokenWhenEnabled() {
        if (!observabilityProperties.isMetricsEnabled()) {
            return;
        }
        if (!StringUtils.hasText(observabilityProperties.getManagementToken())) {
            throw new IllegalStateException(
                    "METRICS_ENABLED=true em produção exige MANAGEMENT_TOKEN configurado.");
        }
    }

    private void requireOpenAiKey() {
        String key = firstNonBlank(
                environment.getProperty("OPENAI_API_KEY"),
                environment.getProperty("spring.ai.openai.api-key")
        );
        if (!StringUtils.hasText(key)) {
            throw new IllegalStateException(
                    "Produção com copiloto habilitado exige OPENAI_API_KEY configurada.");
        }
    }

    private void warnIfSandboxAsaas() {
        if (!billingProperties.isBillingEnabled() && !billingProperties.isAsaasEnabled()) {
            return;
        }
        String baseUrl = billingProperties.getAsaas().getBaseUrl();
        if (baseUrl != null && baseUrl.contains("sandbox")) {
            log.warn("ASAAS_BASE_URL aponta para sandbox — confirme antes do go-live.");
        }
    }

    private void warnIfLocalhostCorsInProduction(boolean production) {
        if (!production) {
            return;
        }
        List<String> origins = corsProperties.getAllowedOrigins();
        boolean hasLocalhost = origins.stream().anyMatch(o -> o.contains("localhost") || o.contains("127.0.0.1"));
        if (hasLocalhost) {
            log.warn("CORS_ALLOWED_ORIGINS inclui localhost em produção — restrinja às origens reais.");
        }
    }

    private static String firstNonBlank(String... values) {
        for (String value : values) {
            if (StringUtils.hasText(value)) {
                return value;
            }
        }
        return null;
    }
}
