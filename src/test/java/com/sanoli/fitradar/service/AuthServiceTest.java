package com.sanoli.fitradar.service;

import com.sanoli.fitradar.domain.AppUser;
import com.sanoli.fitradar.domain.RefreshToken;
import com.sanoli.fitradar.domain.TokenPurpose;
import com.sanoli.fitradar.domain.UserActionToken;
import com.sanoli.fitradar.domain.UserRole;
import com.sanoli.fitradar.dto.AuthResponse;
import com.sanoli.fitradar.dto.ForgotPasswordRequest;
import com.sanoli.fitradar.dto.LoginRequest;
import com.sanoli.fitradar.dto.MessageResponse;
import com.sanoli.fitradar.dto.RefreshTokenRequest;
import com.sanoli.fitradar.dto.RegisterRequest;
import com.sanoli.fitradar.dto.ResetPasswordRequest;
import com.sanoli.fitradar.exception.BusinessException;
import com.sanoli.fitradar.repository.RefreshTokenRepository;
import com.sanoli.fitradar.repository.UserActionTokenRepository;
import com.sanoli.fitradar.repository.UserRepository;
import com.sanoli.fitradar.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AuthServiceTest {

    private static final String EMAIL = "creator@test.local";
    private static final String PASSWORD = "senha12345";

    private UserRepository userRepository;
    private RefreshTokenRepository refreshTokenRepository;
    private UserActionTokenRepository userActionTokenRepository;
    private PasswordEncoder passwordEncoder;
    private JwtService jwtService;
    private TokenService tokenService;
    private AuthService authService;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        refreshTokenRepository = mock(RefreshTokenRepository.class);
        userActionTokenRepository = mock(UserActionTokenRepository.class);
        passwordEncoder = new BCryptPasswordEncoder();
        jwtService = mock(JwtService.class);
        tokenService = mock(TokenService.class);

        authService = new AuthService(
                userRepository,
                refreshTokenRepository,
                userActionTokenRepository,
                passwordEncoder,
                jwtService,
                tokenService,
                mock(EmailService.class),
                mock(LoginRateLimiter.class),
                "http://localhost:8080"
        );

        when(jwtService.generateToken(any(AppUser.class))).thenReturn("jwt-token");
        when(tokenService.createRefreshToken(any(AppUser.class))).thenReturn("refresh-token");
        when(tokenService.createEmailVerificationToken(any(AppUser.class))).thenReturn("verify-token");
        when(tokenService.createPasswordResetToken(any(AppUser.class))).thenReturn("reset-token");
    }

    @Test
    void register_createsCreatorAndReturnsTokens() {
        when(userRepository.existsByEmailIgnoreCase(EMAIL)).thenReturn(false);
        when(userRepository.save(any(AppUser.class))).thenAnswer(invocation -> {
            AppUser user = invocation.getArgument(0);
            user.setId(UUID.randomUUID());
            return user;
        });

        AuthResponse response = authService.register(new RegisterRequest("Creator", EMAIL, PASSWORD));

        assertThat(response.token()).isEqualTo("jwt-token");
        assertThat(response.refreshToken()).isEqualTo("refresh-token");
        assertThat(response.user().email()).isEqualTo(EMAIL);
        assertThat(response.user().role()).isEqualTo(UserRole.CREATOR);
    }

    @Test
    void register_rejectsDuplicateEmail() {
        when(userRepository.existsByEmailIgnoreCase(EMAIL)).thenReturn(true);

        assertThatThrownBy(() -> authService.register(new RegisterRequest("Creator", EMAIL, PASSWORD)))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Já existe");
    }

    @Test
    void login_succeedsWithValidCredentials() {
        AppUser user = savedCreator();
        when(userRepository.findByEmailIgnoreCase(EMAIL)).thenReturn(Optional.of(user));

        AuthResponse response = authService.login(new LoginRequest(EMAIL, PASSWORD));

        assertThat(response.token()).isEqualTo("jwt-token");
        assertThat(response.user().email()).isEqualTo(EMAIL);
    }

    @Test
    void login_rejectsWrongPassword() {
        AppUser user = savedCreator();
        when(userRepository.findByEmailIgnoreCase(EMAIL)).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> authService.login(new LoginRequest(EMAIL, "wrong")))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    void refresh_rotatesTokenAndReturnsNewAuth() {
        AppUser user = savedCreator();
        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setToken("old-refresh");
        refreshToken.setUser(user);
        refreshToken.setExpiresAt(LocalDateTime.now().plusDays(7));
        refreshToken.setRevoked(false);

        when(refreshTokenRepository.findByTokenAndRevokedFalse("old-refresh")).thenReturn(Optional.of(refreshToken));
        when(refreshTokenRepository.save(refreshToken)).thenReturn(refreshToken);

        AuthResponse response = authService.refresh(new RefreshTokenRequest("old-refresh"));

        assertThat(refreshToken.isRevoked()).isTrue();
        assertThat(response.token()).isEqualTo("jwt-token");
        verify(refreshTokenRepository).save(refreshToken);
    }

    @Test
    void refresh_rejectsUnknownToken() {
        when(refreshTokenRepository.findByTokenAndRevokedFalse("bad")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.refresh(new RefreshTokenRequest("bad")))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("inválido");
    }

    @Test
    void forgotPassword_returnsGenericMessageEvenWhenEmailMissing() {
        when(userRepository.findByEmailIgnoreCase("ghost@test.local")).thenReturn(Optional.empty());

        MessageResponse response = authService.forgotPassword(new ForgotPasswordRequest("ghost@test.local"));

        assertThat(response.message()).contains("Se o email existir");
    }

    @Test
    void forgotPassword_triggersResetForExistingUser() {
        AppUser user = savedCreator();
        when(userRepository.findByEmailIgnoreCase(EMAIL)).thenReturn(Optional.of(user));

        MessageResponse response = authService.forgotPassword(new ForgotPasswordRequest(EMAIL));

        assertThat(response.message()).isNotBlank();
        verify(tokenService).createPasswordResetToken(user);
    }

    @Test
    void resetPassword_updatesPasswordAndMarksTokenUsed() {
        AppUser user = savedCreator();
        UserActionToken token = new UserActionToken();
        token.setUser(user);
        token.setToken("reset-token");
        token.setPurpose(TokenPurpose.PASSWORD_RESET);
        token.setExpiresAt(LocalDateTime.now().plusHours(1));
        token.setUsed(false);

        when(userActionTokenRepository.findByTokenAndPurposeAndUsedFalse("reset-token", TokenPurpose.PASSWORD_RESET))
                .thenReturn(Optional.of(token));
        when(userRepository.save(user)).thenReturn(user);
        when(userActionTokenRepository.save(token)).thenReturn(token);

        MessageResponse response = authService.resetPassword(
                new ResetPasswordRequest("reset-token", "novaSenha12345"));

        assertThat(response.message()).contains("atualizada");
        assertThat(token.isUsed()).isTrue();
        assertThat(passwordEncoder.matches("novaSenha12345", user.getPasswordHash())).isTrue();
    }

    private AppUser savedCreator() {
        AppUser user = new AppUser();
        user.setId(UUID.randomUUID());
        user.setName("Creator");
        user.setEmail(EMAIL);
        user.setPasswordHash(passwordEncoder.encode(PASSWORD));
        user.setRole(UserRole.CREATOR);
        return user;
    }
}
