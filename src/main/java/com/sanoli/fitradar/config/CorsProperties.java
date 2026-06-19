package com.sanoli.fitradar.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.ArrayList;
import java.util.List;

@ConfigurationProperties(prefix = "app.cors")
public class CorsProperties {

    /** Origens permitidas (nunca use * em produção). */
    private List<String> allowedOrigins = new ArrayList<>(List.of("http://localhost:8080", "http://localhost:5173"));

    public List<String> getAllowedOrigins() {
        return allowedOrigins;
    }

    public void setAllowedOrigins(List<String> allowedOrigins) {
        this.allowedOrigins = allowedOrigins;
    }
}
