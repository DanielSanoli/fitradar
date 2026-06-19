package com.sanoli.fitradar.config;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ProductionStartupValidatorTest {

    private MockEnvironment environment;
    private AppRuntimeProperties runtimeProperties;
    private BillingProperties billingProperties;
    private CopilotProperties copilotProperties;
    private CorsProperties corsProperties;

    @BeforeEach
    void setUp() {
        environment = new MockEnvironment();
        runtimeProperties = new AppRuntimeProperties();
        billingProperties = new BillingProperties();
        copilotProperties = new CopilotProperties();
        corsProperties = new CorsProperties();
        corsProperties.setAllowedOrigins(List.of("http://localhost:8080"));
    }

    @Test
    void billingEnabledWithoutWebhookToken_failsStartup() {
        billingProperties.getAsaas().setEnabled(true);
        billingProperties.getAsaas().setApiKey("asaas-key");
        billingProperties.getAsaas().setBaseUrl("https://api.asaas.com/v3");
        billingProperties.getAsaas().setWebhookToken("");

        assertThatThrownBy(this::validate)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("ASAAS_WEBHOOK_TOKEN");
    }

    @Test
    void billingEnabledWithoutApiKey_failsStartup() {
        billingProperties.getAsaas().setEnabled(true);
        billingProperties.getAsaas().setApiKey("");
        billingProperties.getAsaas().setBaseUrl("https://api.asaas.com/v3");
        billingProperties.getAsaas().setWebhookToken("wh-token");

        assertThatThrownBy(this::validate)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("ASAAS_API_KEY");
    }

    @Test
    void billingEnabledWithRequiredConfig_succeedsInDev() {
        billingProperties.getAsaas().setEnabled(true);
        billingProperties.getAsaas().setApiKey("asaas-key");
        billingProperties.getAsaas().setBaseUrl("https://api.asaas.com/v3");
        billingProperties.getAsaas().setWebhookToken("wh-token");

        assertThatCode(this::validate).doesNotThrowAnyException();
    }

    @Test
    void productionWithDefaultJwt_failsStartup() {
        runtimeProperties.setProduction(true);
        environment.setProperty("app.security.jwt.secret",
                "fitradar-dev-secret-please-change-this-to-a-long-random-value");

        assertThatThrownBy(this::validate)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("JWT_SECRET");
    }

    @Test
    void wildcardCorsOrigin_failsStartup() {
        corsProperties.setAllowedOrigins(List.of("*"));

        assertThatThrownBy(this::validate)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("CORS");
    }

    private void validate() {
        new ProductionStartupValidator(
                environment, runtimeProperties, billingProperties, copilotProperties, corsProperties
        ).validate();
    }
}
