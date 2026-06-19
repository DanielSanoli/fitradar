package com.sanoli.fitradar.observability;

/**
 * Utilitários para evitar vazamento de PII/segredos em logs e telemetria.
 */
public final class LoggingSanitizer {

    private LoggingSanitizer() {
    }

    public static String maskEmail(String email) {
        if (email == null || !email.contains("@")) {
            return "***";
        }
        return "*" + email.substring(email.indexOf('@'));
    }

    public static String refId(String id) {
        if (id == null || id.isBlank()) {
            return "n/a";
        }
        if (id.length() <= 8) {
            return id.substring(0, Math.min(4, id.length())) + "***";
        }
        return id.substring(0, 8) + "...";
    }

    public static boolean containsSensitivePatterns(String text) {
        if (text == null || text.isBlank()) {
            return false;
        }
        String lower = text.toLowerCase();
        return lower.contains("password")
                || lower.contains("bearer ")
                || lower.contains("eyj") // prefixo típico de JWT
                || lower.contains("api_key")
                || lower.contains("api-key")
                || lower.contains("secret")
                || lower.contains("feeling=")
                || lower.contains("\"feeling\"")
                || lower.contains("\"notes\"");
    }
}
