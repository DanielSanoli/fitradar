package com.sanoli.fitradar.dto;

final class SessionDeviceLabel {

    private SessionDeviceLabel() {
    }

    static String fromUserAgent(String userAgent) {
        if (userAgent == null || userAgent.isBlank()) {
            return "Dispositivo desconhecido";
        }
        String ua = userAgent.toLowerCase();
        if (ua.contains("iphone") || ua.contains("ipad")) {
            return "iPhone / iPad";
        }
        if (ua.contains("android")) {
            return "Android";
        }
        if (ua.contains("windows")) {
            return "Windows";
        }
        if (ua.contains("macintosh") || ua.contains("mac os")) {
            return "Mac";
        }
        if (ua.contains("linux")) {
            return "Linux";
        }
        return "Navegador web";
    }
}
