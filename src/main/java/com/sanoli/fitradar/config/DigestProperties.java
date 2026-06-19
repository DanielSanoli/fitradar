package com.sanoli.fitradar.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.digest")
public class DigestProperties {

    private boolean enabled = true;
    private String weeklyCron = "0 0 8 * * MON";
    private String nudgeCron = "0 0 9 * * *";

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public String getWeeklyCron() {
        return weeklyCron;
    }

    public void setWeeklyCron(String weeklyCron) {
        this.weeklyCron = weeklyCron;
    }

    public String getNudgeCron() {
        return nudgeCron;
    }

    public void setNudgeCron(String nudgeCron) {
        this.nudgeCron = nudgeCron;
    }
}
