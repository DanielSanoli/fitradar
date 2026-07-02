package com.sanoli.fitradar.security;

import com.sanoli.fitradar.config.JwtCookieProperties;
import com.sanoli.fitradar.exception.BusinessException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.Optional;

/**
 * Refresh token em cookie httpOnly — inacessível a JavaScript (mitiga XSS).
 * SameSite=Strict: refresh só em requests same-site iniciadas pelo app.
 */
@Service
public class RefreshTokenCookieService {

    private final JwtCookieProperties properties;

    public RefreshTokenCookieService(JwtCookieProperties properties) {
        this.properties = properties;
    }

    public void writeRefreshToken(HttpServletResponse response, String rawToken) {
        response.addHeader(HttpHeaders.SET_COOKIE, buildCookie(rawToken, cookieMaxAgeSeconds()).toString());
    }

    public void clearRefreshToken(HttpServletResponse response) {
        response.addHeader(HttpHeaders.SET_COOKIE, buildCookie("", 0).toString());
    }

    public Optional<String> readRefreshToken(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return Optional.empty();
        }
        return Arrays.stream(cookies)
                .filter(cookie -> properties.getRefreshCookieName().equals(cookie.getName()))
                .map(Cookie::getValue)
                .filter(value -> value != null && !value.isBlank())
                .findFirst();
    }

    public String requireRefreshToken(HttpServletRequest request) {
        return readRefreshToken(request)
                .orElseThrow(() -> new BusinessException("Sessão expirada. Faça login novamente."));
    }

    private ResponseCookie buildCookie(String value, long maxAgeSeconds) {
        return ResponseCookie.from(properties.getRefreshCookieName(), value)
                .httpOnly(true)
                .secure(properties.isRefreshCookieSecure())
                .path(properties.getRefreshCookiePath())
                .maxAge(maxAgeSeconds)
                .sameSite(properties.getRefreshCookieSameSite())
                .build();
    }

    private long cookieMaxAgeSeconds() {
        return (long) properties.getRefreshTokenTtlDays() * 24 * 60 * 60;
    }
}
