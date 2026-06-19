package com.sanoli.fitradar.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.runtime")
public class AppRuntimeProperties {

    /** Quando true, validações de produção são obrigatórias no startup. */
    private boolean production = false;

    /** Seed demo opcional no primeiro acesso do criador. */
    private boolean demoSeedEnabled = true;

    public boolean isProduction() {
        return production;
    }

    public void setProduction(boolean production) {
        this.production = production;
    }

    public boolean isDemoSeedEnabled() {
        return demoSeedEnabled;
    }

    public void setDemoSeedEnabled(boolean demoSeedEnabled) {
        this.demoSeedEnabled = demoSeedEnabled;
    }
}
