package com.sanoli.fitradar.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.math.BigDecimal;

@ConfigurationProperties(prefix = "app.billing")
public class BillingProperties {

    private int trialDays = 14;
    private Asaas asaas = new Asaas();
    private Marketplace marketplace = new Marketplace();

    public int getTrialDays() {
        return trialDays;
    }

    public void setTrialDays(int trialDays) {
        this.trialDays = trialDays;
    }

    public Asaas getAsaas() {
        return asaas;
    }

    public void setAsaas(Asaas asaas) {
        this.asaas = asaas;
    }

    public Marketplace getMarketplace() {
        return marketplace;
    }

    public void setMarketplace(Marketplace marketplace) {
        this.marketplace = marketplace;
    }

    public boolean isAsaasEnabled() {
        return asaas != null && asaas.isEnabled() && hasText(asaas.getApiKey());
    }

    /** Billing explicitamente ligado via ASAAS_ENABLED — dispara validação fail-fast no startup. */
    public boolean isBillingEnabled() {
        return asaas != null && asaas.isEnabled();
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    public static class Asaas {
        private boolean enabled = false;
        private String baseUrl = "https://sandbox.asaas.com/api/v3";
        private String apiKey = "";
        private BigDecimal monthlyPrice = new BigDecimal("49.90");
        private String webhookToken = "";

        public String getBaseUrl() {
            return baseUrl;
        }

        public void setBaseUrl(String baseUrl) {
            this.baseUrl = baseUrl;
        }

        public String getApiKey() {
            return apiKey;
        }

        public void setApiKey(String apiKey) {
            this.apiKey = apiKey;
        }

        public BigDecimal getMonthlyPrice() {
            return monthlyPrice;
        }

        public void setMonthlyPrice(BigDecimal monthlyPrice) {
            this.monthlyPrice = monthlyPrice;
        }

        public String getWebhookToken() {
            return webhookToken;
        }

        public void setWebhookToken(String webhookToken) {
            this.webhookToken = webhookToken;
        }

        public boolean isEnabled() {
            return enabled;
        }

        public void setEnabled(boolean enabled) {
            this.enabled = enabled;
        }
    }

    /**
     * Cobrança aluno→criador com split: a taxa da plataforma fica na conta raiz (FitRadar).
     */
    public static class Marketplace {
        /** Percentual retido pela plataforma em cada venda (ex.: 10 = 10%). */
        private BigDecimal platformFeePercent = new BigDecimal("10.00");

        public BigDecimal getPlatformFeePercent() {
            return platformFeePercent;
        }

        public void setPlatformFeePercent(BigDecimal platformFeePercent) {
            this.platformFeePercent = platformFeePercent;
        }
    }
}
