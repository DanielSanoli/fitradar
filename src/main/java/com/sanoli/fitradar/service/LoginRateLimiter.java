package com.sanoli.fitradar.service;

import com.sanoli.fitradar.exception.BusinessException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class LoginRateLimiter {

    private final int maxAttempts;
    private final int windowMinutes;
    private final Map<String, AttemptWindow> attemptsByEmail = new ConcurrentHashMap<>();

    public LoginRateLimiter(
            @Value("${app.auth.login-max-attempts:5}") int maxAttempts,
            @Value("${app.auth.login-window-minutes:15}") int windowMinutes
    ) {
        this.maxAttempts = maxAttempts;
        this.windowMinutes = windowMinutes;
    }

    public void checkAllowed(String email) {
        AttemptWindow window = attemptsByEmail.computeIfAbsent(normalize(email), key -> new AttemptWindow());
        synchronized (window) {
            window.refreshIfExpired(windowMinutes);
            if (window.count >= maxAttempts) {
                throw new BusinessException("Muitas tentativas de login. Tente novamente mais tarde.");
            }
        }
    }

    public void registerFailure(String email) {
        AttemptWindow window = attemptsByEmail.computeIfAbsent(normalize(email), key -> new AttemptWindow());
        synchronized (window) {
            window.refreshIfExpired(windowMinutes);
            window.count++;
        }
    }

    public void reset(String email) {
        attemptsByEmail.remove(normalize(email));
    }

    private String normalize(String email) {
        return email.trim().toLowerCase();
    }

    private static final class AttemptWindow {
        private int count;
        private LocalDateTime windowStart = LocalDateTime.now();

        private void refreshIfExpired(int windowMinutes) {
            if (windowStart.plusMinutes(windowMinutes).isBefore(LocalDateTime.now())) {
                count = 0;
                windowStart = LocalDateTime.now();
            }
        }
    }
}
