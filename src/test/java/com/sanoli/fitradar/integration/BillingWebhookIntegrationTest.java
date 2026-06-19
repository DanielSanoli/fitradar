package com.sanoli.fitradar.integration;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class BillingWebhookIntegrationTest extends AbstractIntegrationTest {

    private static final String WEBHOOK_TOKEN = "integration-webhook-secret";

    @Autowired
    MockMvc mockMvc;

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
                        .content("{\"event\":\"PAYMENT_CONFIRMED\",\"payment\":{}}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void webhookRejectsWrongToken() throws Exception {
        mockMvc.perform(post("/api/v1/billing/webhook")
                        .header("asaas-access-token", "wrong-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"event\":\"PAYMENT_CONFIRMED\",\"payment\":{}}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void webhookAcceptsValidToken() throws Exception {
        mockMvc.perform(post("/api/v1/billing/webhook")
                        .header("asaas-access-token", WEBHOOK_TOKEN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"event\":\"UNKNOWN\",\"payment\":{}}"))
                .andExpect(status().isOk());
    }
}
