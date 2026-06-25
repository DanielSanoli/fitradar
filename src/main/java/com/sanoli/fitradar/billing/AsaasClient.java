package com.sanoli.fitradar.billing;

import com.fasterxml.jackson.databind.JsonNode;
import com.sanoli.fitradar.config.BillingProperties;
import com.sanoli.fitradar.exception.BusinessException;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class AsaasClient {

    private final BillingProperties billingProperties;
    private final RestClient restClient;

    public AsaasClient(BillingProperties billingProperties, RestClient.Builder restClientBuilder) {
        this.billingProperties = billingProperties;
        this.restClient = restClientBuilder
                .baseUrl(billingProperties.getAsaas().getBaseUrl())
                .defaultHeader("access_token", billingProperties.getAsaas().getApiKey())
                .defaultHeader("Content-Type", MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    public String createCustomer(String name, String email, String cpfCnpj) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("name", name);
        payload.put("email", email);
        payload.put("notificationDisabled", true);
        if (cpfCnpj != null && !cpfCnpj.isBlank()) {
            payload.put("cpfCnpj", cpfCnpj);
        }

        JsonNode response = post("/customers", payload);
        return requiredText(response, "id");
    }

    public AsaasSubscriptionResult createSubscription(String customerId, BigDecimal value) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("customer", customerId);
        payload.put("billingType", "UNDEFINED");
        payload.put("cycle", "MONTHLY");
        payload.put("value", value);
        payload.put("description", "FitRadar Pro");

        JsonNode response = post("/subscriptions", payload);
        return new AsaasSubscriptionResult(
                requiredText(response, "id"),
                textOrNull(response, "invoiceUrl")
        );
    }

    public void deleteSubscription(String subscriptionId) {
        delete("/subscriptions/" + subscriptionId);
    }

    public JsonNode listPaymentsBySubscription(String subscriptionId, int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 50));
        return get("/payments?subscription=" + subscriptionId + "&limit=" + safeLimit + "&order=desc");
    }

    /**
     * Cobrança avulsa com split para a carteira do criador. O saldo restante fica na conta raiz (taxa FitRadar).
     */
    public AsaasPaymentResult createPaymentWithSplit(
            String customerId,
            BigDecimal value,
            String description,
            String externalReference,
            String creatorWalletId,
            BigDecimal creatorSplitPercent
    ) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("customer", customerId);
        payload.put("billingType", "UNDEFINED");
        payload.put("value", value);
        payload.put("dueDate", LocalDate.now().plusDays(3).toString());
        payload.put("description", description);
        payload.put("externalReference", externalReference);

        List<Map<String, Object>> splits = new ArrayList<>();
        Map<String, Object> split = new HashMap<>();
        split.put("walletId", creatorWalletId);
        split.put("percentualValue", creatorSplitPercent);
        splits.add(split);
        payload.put("splits", splits);

        JsonNode response = post("/payments", payload);
        return new AsaasPaymentResult(
                requiredText(response, "id"),
                textOrNull(response, "invoiceUrl")
        );
    }

    private JsonNode post(String path, Map<String, Object> payload) {
        if (!billingProperties.isAsaasEnabled()) {
            throw new BusinessException("Integração Asaas não configurada");
        }

        return restClient.post()
                .uri(path)
                .body(payload)
                .retrieve()
                .body(JsonNode.class);
    }

    private JsonNode get(String path) {
        if (!billingProperties.isAsaasEnabled()) {
            throw new BusinessException("Integração Asaas não configurada");
        }

        return restClient.get()
                .uri(path)
                .retrieve()
                .body(JsonNode.class);
    }

    private void delete(String path) {
        if (!billingProperties.isAsaasEnabled()) {
            throw new BusinessException("Integração Asaas não configurada");
        }

        restClient.delete()
                .uri(path)
                .retrieve()
                .toBodilessEntity();
    }

    private String requiredText(JsonNode node, String field) {
        JsonNode value = node.get(field);
        if (value == null || value.isNull()) {
            throw new BusinessException("Resposta inválida do Asaas");
        }
        return value.asText();
    }

    private String textOrNull(JsonNode node, String field) {
        JsonNode value = node.get(field);
        return value == null || value.isNull() ? null : value.asText();
    }

    public record AsaasSubscriptionResult(String subscriptionId, String checkoutUrl) {
    }

    public record AsaasPaymentResult(String paymentId, String checkoutUrl) {
    }
}
