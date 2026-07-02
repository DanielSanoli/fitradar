package com.sanoli.fitradar.integration;

import com.sanoli.fitradar.domain.WebhookEventStatus;
import com.sanoli.fitradar.repository.WebhookEventRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class BillingWebhookIntegrationTest extends AbstractIntegrationTest {

    private static final String WEBHOOK_TOKEN = "integration-webhook-secret";

    @Autowired
    MockMvc mockMvc;

    @Autowired
    WebhookEventRepository webhookEventRepository;

    @DynamicPropertySource
    static void enableBilling(DynamicPropertyRegistry registry) {
        registry.add("app.billing.asaas.enabled", () -> "true");
        registry.add("app.billing.asaas.api-key", () -> "test-asaas-key");
        registry.add("app.billing.asaas.base-url", () -> "https://sandbox.asaas.com/api/v3");
        registry.add("app.billing.asaas.webhook-token", () -> WEBHOOK_TOKEN);
    }

    @Test
    void webhookRejectsMissingToken() throws Exception {
        mockMvc.perform(post("/api/v1/billing/webhook")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"id":"evt_missing_token","event":"PAYMENT_CONFIRMED","payment":{}}
                                """))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void webhookRejectsWrongToken() throws Exception {
        mockMvc.perform(post("/api/v1/billing/webhook")
                        .header("asaas-access-token", "wrong-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"id":"evt_wrong_token","event":"PAYMENT_CONFIRMED","payment":{}}
                                """))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void webhookAcceptsValidToken() throws Exception {
        mockMvc.perform(post("/api/v1/billing/webhook")
                        .header("asaas-access-token", WEBHOOK_TOKEN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"id":"evt_unknown","event":"UNKNOWN","payment":{}}
                                """))
                .andExpect(status().isOk());

        var stored = webhookEventRepository.findByEventId("evt_unknown").orElseThrow();
        assertThat(stored.getStatus()).isEqualTo(WebhookEventStatus.IGNORED);
        assertThat(stored.getProcessedAt()).isNotNull();
    }

    @Test
    void webhookIsIdempotentForSameEventId() throws Exception {
        String payload = """
                {"id":"evt_idempotent","event":"UNKNOWN","payment":{}}
                """;

        mockMvc.perform(post("/api/v1/billing/webhook")
                        .header("asaas-access-token", WEBHOOK_TOKEN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/billing/webhook")
                        .header("asaas-access-token", WEBHOOK_TOKEN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk());

        assertThat(webhookEventRepository.findByEventId("evt_idempotent")).isPresent();
        assertThat(webhookEventRepository.findByEventId("evt_idempotent").orElseThrow().getStatus())
                .isEqualTo(WebhookEventStatus.IGNORED);
    }
}
