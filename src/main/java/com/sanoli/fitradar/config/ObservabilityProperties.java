package com.sanoli.fitradar.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.observability")
public class ObservabilityProperties {

    /** Expõe /actuator/prometheus quando true (protegido por token). */
    private boolean metricsEnabled = false;

    /** Token exigido no header X-Management-Token para endpoints de métricas. */
    private String managementToken = "";

    public boolean isMetricsEnabled() {
        return metricsEnabled;
    }

    public void setMetricsEnabled(boolean metricsEnabled) {
        this.metricsEnabled = metricsEnabled;
    }

    public String getManagementToken() {
        return managementToken;
    }

    public void setManagementToken(String managementToken) {
        this.managementToken = managementToken;
    }
}
