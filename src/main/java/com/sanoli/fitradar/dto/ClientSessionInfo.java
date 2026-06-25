package com.sanoli.fitradar.dto;

import jakarta.servlet.http.HttpServletRequest;

public record ClientSessionInfo(String userAgent, String ipAddress) {

    public static final ClientSessionInfo UNKNOWN = new ClientSessionInfo(null, null);

    public static ClientSessionInfo from(HttpServletRequest request) {
        if (request == null) {
            return UNKNOWN;
        }
        return new ClientSessionInfo(truncate(request.getHeader("User-Agent"), 512), resolveClientIp(request));
    }

    private static String resolveClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            String first = forwarded.split(",")[0].trim();
            if (!first.isEmpty()) {
                return truncate(first, 64);
            }
        }
        return truncate(request.getRemoteAddr(), 64);
    }

    private static String truncate(String value, int maxLength) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.length() <= maxLength ? value : value.substring(0, maxLength);
    }
}
