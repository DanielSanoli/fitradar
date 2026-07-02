package com.sanoli.fitradar.service;

import com.sanoli.fitradar.domain.AppUser;
import com.sanoli.fitradar.domain.RefreshToken;
import com.sanoli.fitradar.domain.TokenPurpose;
import com.sanoli.fitradar.domain.UserActionToken;
import com.sanoli.fitradar.domain.UserRole;
import com.sanoli.fitradar.dto.ClientSessionInfo;
import com.sanoli.fitradar.repository.RefreshTokenRepository;
import com.sanoli.fitradar.repository.UserActionTokenRepository;
import com.sanoli.fitradar.security.TokenHashUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class TokenServiceTest {

    private RefreshTokenRepository refreshTokenRepository;
    private UserActionTokenRepository userActionTokenRepository;
    private TokenService tokenService;

    @BeforeEach
    void setUp() {
        refreshTokenRepository = mock(RefreshTokenRepository.class);
        userActionTokenRepository = mock(UserActionTokenRepository.class);
        tokenService = new TokenService(refreshTokenRepository, userActionTokenRepository, 30, 2, 48);
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(userActionTokenRepository.save(any(UserActionToken.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void createRefreshToken_persistsHashAndReturnsRawToken() {
        AppUser user = user();

        String rawToken = tokenService.createRefreshToken(user, ClientSessionInfo.UNKNOWN);

        ArgumentCaptor<RefreshToken> captor = ArgumentCaptor.forClass(RefreshToken.class);
        verify(refreshTokenRepository).save(captor.capture());
        assertThat(captor.getValue().getTokenHash()).isEqualTo(TokenHashUtil.sha256Hex(rawToken));
        assertThat(captor.getValue().getTokenHash()).isNotEqualTo(rawToken);
    }

    @Test
    void createPasswordResetToken_persistsHashAndReturnsRawToken() {
        AppUser user = user();

        String rawToken = tokenService.createPasswordResetToken(user);

        ArgumentCaptor<UserActionToken> captor = ArgumentCaptor.forClass(UserActionToken.class);
        verify(userActionTokenRepository).save(captor.capture());
        assertThat(captor.getValue().getTokenHash()).isEqualTo(TokenHashUtil.sha256Hex(rawToken));
        assertThat(captor.getValue().getPurpose()).isEqualTo(TokenPurpose.PASSWORD_RESET);
    }

    private static AppUser user() {
        AppUser user = new AppUser();
        user.setId(UUID.randomUUID());
        user.setEmail("user@test.local");
        user.setRole(UserRole.CREATOR);
        return user;
    }
}
