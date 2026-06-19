package com.sanoli.fitradar.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.email")
public class MailProperties {

    private Resend resend = new Resend();

    public Resend getResend() {
        return resend;
    }

    public void setResend(Resend resend) {
        this.resend = resend;
    }

    public boolean isEnabled() {
        return resend != null && resend.getApiKey() != null && !resend.getApiKey().isBlank();
    }

    public String getFrom() {
        return resend != null ? resend.getFrom() : null;
    }

    public String getApiKey() {
        return resend != null ? resend.getApiKey() : null;
    }

    public static class Resend {
        private String apiKey = "";
        private String from = "FitRadar <no-reply@fitradar.app>";

        public String getApiKey() {
            return apiKey;
        }

        public void setApiKey(String apiKey) {
            this.apiKey = apiKey;
        }

        public String getFrom() {
            return from;
        }

        public void setFrom(String from) {
            this.from = from;
        }
    }
}
