package com.sanoli.fitradar.service;

import com.sanoli.fitradar.domain.AppUser;
import com.sanoli.fitradar.domain.RefreshToken;
import com.sanoli.fitradar.domain.TokenPurpose;
import com.sanoli.fitradar.domain.UserActionToken;
import com.sanoli.fitradar.dto.ClientSessionInfo;
import com.sanoli.fitradar.repository.RefreshTokenRepository;
import com.sanoli.fitradar.repository.UserActionTokenRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.UUID;
import java.util.Base64;

@Service
public class TokenService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final RefreshTokenRepository refreshTokenRepository;
    private final UserActionTokenRepository userActionTokenRepository;
    private final int refreshTokenExpirationDays;
    private final int passwordResetExpirationHours;
    private final int emailVerificationExpirationHours;

    public TokenService(
            RefreshTokenRepository refreshTokenRepository,
            UserActionTokenRepository userActionTokenRepository,
            @Value("${app.security.jwt.refresh-token-ttl-days:30}") int refreshTokenExpirationDays,
            @Value("${app.auth.password-reset-expiration-hours:2}") int passwordResetExpirationHours,
            @Value("${app.auth.email-verification-expiration-hours:48}") int emailVerificationExpirationHours
    ) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.userActionTokenRepository = userActionTokenRepository;
        this.refreshTokenExpirationDays = refreshTokenExpirationDays;
        this.passwordResetExpirationHours = passwordResetExpirationHours;
        this.emailVerificationExpirationHours = emailVerificationExpirationHours;
    }

    @Transactional
    public String createRefreshToken(AppUser user) {
        return createRefreshToken(user, ClientSessionInfo.UNKNOWN);
    }

    @Transactional
    public String createRefreshToken(AppUser user, ClientSessionInfo sessionInfo) {
        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setUser(user);
        refreshToken.setToken(generateToken());
        refreshToken.setExpiresAt(LocalDateTime.now().plusDays(refreshTokenExpirationDays));
        if (sessionInfo != null) {
            refreshToken.setUserAgent(sessionInfo.userAgent());
            refreshToken.setIpAddress(sessionInfo.ipAddress());
        }
        return refreshTokenRepository.save(refreshToken).getToken();
    }

    @Transactional
    public void revokeRefreshToken(String token) {
        if (token == null || token.isBlank()) {
            return;
        }
        refreshTokenRepository.revokeByToken(token);
    }

    @Transactional
    public void revokeAllRefreshTokensForUser(UUID userId) {
        refreshTokenRepository.revokeAllActiveForUser(userId);
    }

    @Transactional
    public String createPasswordResetToken(AppUser user) {
        return createActionToken(user, TokenPurpose.PASSWORD_RESET, passwordResetExpirationHours);
    }

    @Transactional
    public String createEmailVerificationToken(AppUser user) {
        return createActionToken(user, TokenPurpose.EMAIL_VERIFICATION, emailVerificationExpirationHours);
    }

    private String createActionToken(AppUser user, TokenPurpose purpose, int expirationHours) {
        UserActionToken token = new UserActionToken();
        token.setUser(user);
        token.setPurpose(purpose);
        token.setToken(generateToken());
        token.setExpiresAt(LocalDateTime.now().plusHours(expirationHours));
        return userActionTokenRepository.save(token).getToken();
    }

    private String generateToken() {
        byte[] bytes = new byte[32];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
