package com.sanoli.fitradar.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.math.BigDecimal;

/**
 * Limiares e pesos do motor de retenção. Configuráveis (Regra de Ouro: o motor é determinístico).
 */
@ConfigurationProperties(prefix = "app.retention")
public class RetentionProperties {

    private Weights weights = new Weights();
    private int highThreshold = 70;
    private int mediumThreshold = 40;
    private int inactivitySaturationDays = 14;
    private int inactiveAlertDays = 7;
    private int minHistoryDays = 7;
    private String timezone = "America/Sao_Paulo";
    private String alertsCron = "0 0 8 * * *";

    public Weights getWeights() {
        return weights;
    }

    public void setWeights(Weights weights) {
        this.weights = weights;
    }

    public int getHighThreshold() {
        return highThreshold;
    }

    public void setHighThreshold(int highThreshold) {
        this.highThreshold = highThreshold;
    }

    public int getMediumThreshold() {
        return mediumThreshold;
    }

    public void setMediumThreshold(int mediumThreshold) {
        this.mediumThreshold = mediumThreshold;
    }

    public int getInactivitySaturationDays() {
        return inactivitySaturationDays;
    }

    public void setInactivitySaturationDays(int inactivitySaturationDays) {
        this.inactivitySaturationDays = inactivitySaturationDays;
    }

    public int getInactiveAlertDays() {
        return inactiveAlertDays;
    }

    public void setInactiveAlertDays(int inactiveAlertDays) {
        this.inactiveAlertDays = inactiveAlertDays;
    }

    public int getMinHistoryDays() {
        return minHistoryDays;
    }

    public void setMinHistoryDays(int minHistoryDays) {
        this.minHistoryDays = minHistoryDays;
    }

    public String getTimezone() {
        return timezone;
    }

    public void setTimezone(String timezone) {
        this.timezone = timezone;
    }

    public String getAlertsCron() {
        return alertsCron;
    }

    public void setAlertsCron(String alertsCron) {
        this.alertsCron = alertsCron;
    }

    public static class Weights {
        private BigDecimal inactivity = new BigDecimal("0.45");
        private BigDecimal adherenceDrop = new BigDecimal("0.30");
        private BigDecimal lowAdherence = new BigDecimal("0.25");

        public BigDecimal getInactivity() {
            return inactivity;
        }

        public void setInactivity(BigDecimal inactivity) {
            this.inactivity = inactivity;
        }

        public BigDecimal getAdherenceDrop() {
            return adherenceDrop;
        }

        public void setAdherenceDrop(BigDecimal adherenceDrop) {
            this.adherenceDrop = adherenceDrop;
        }

        public BigDecimal getLowAdherence() {
            return lowAdherence;
        }

        public void setLowAdherence(BigDecimal lowAdherence) {
            this.lowAdherence = lowAdherence;
        }
    }
}
