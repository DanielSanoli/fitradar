package com.sanoli.fitradar.service;

import com.sanoli.fitradar.domain.AppUser;
import com.sanoli.fitradar.domain.RefreshToken;
import com.sanoli.fitradar.domain.UserRole;
import com.sanoli.fitradar.dto.SessionResponse;
import com.sanoli.fitradar.exception.BusinessException;
import com.sanoli.fitradar.repository.RefreshTokenRepository;
import com.sanoli.fitradar.security.TokenHashUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class SessionServiceTest {

    private RefreshTokenRepository refreshTokenRepository;
    private TokenService tokenService;
    private SessionService sessionService;

    @BeforeEach
    void setUp() {
        refreshTokenRepository = mock(RefreshTokenRepository.class);
        tokenService = mock(TokenService.class);
        sessionService = new SessionService(refreshTokenRepository, tokenService);
    }

    @Test
    void listActiveSessions_marksCurrentSession() {
        AppUser user = user();
        RefreshToken current = session(user, "current-token");
        RefreshToken other = session(user, "other-token");

        when(refreshTokenRepository.findByUser_IdAndRevokedFalseAndExpiresAtAfterOrderByCreatedAtDesc(
                eq(user.getId()), any(LocalDateTime.class)))
                .thenReturn(List.of(current, other));

        List<SessionResponse> sessions = sessionService.listActiveSessions(user, "current-token");

        assertThat(sessions).hasSize(2);
        assertThat(sessions.get(0).current()).isTrue();
        assertThat(sessions.get(1).current()).isFalse();
    }

    @Test
    void logout_revokesRefreshToken() {
        sessionService.logout("refresh-abc");

        verify(tokenService).revokeRefreshToken("refresh-abc");
    }

    @Test
    void revokeSession_rejectsForeignSession() {
        AppUser user = user();
        UUID sessionId = UUID.randomUUID();
        when(refreshTokenRepository.findByIdAndUser_Id(sessionId, user.getId())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> sessionService.revokeSession(user, sessionId, "current"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("não encontrada");
    }

    private static AppUser user() {
        AppUser user = new AppUser();
        user.setId(UUID.randomUUID());
        user.setEmail("user@test.local");
        user.setRole(UserRole.CREATOR);
        return user;
    }

    private static RefreshToken session(AppUser user, String token) {
        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setUser(user);
        refreshToken.setTokenHash(TokenHashUtil.sha256Hex(token));
        refreshToken.setExpiresAt(LocalDateTime.now().plusDays(7));
        refreshToken.setRevoked(false);
        refreshToken.setUserAgent("Mozilla/5.0 (Windows NT 10.0)");
        refreshToken.setIpAddress("127.0.0.1");
        return refreshToken;
    }
}
