package com.sanoli.fitradar.service;

import com.sanoli.fitradar.domain.AppUser;
import com.sanoli.fitradar.domain.RefreshToken;
import com.sanoli.fitradar.domain.TokenPurpose;
import com.sanoli.fitradar.domain.UserActionToken;
import com.sanoli.fitradar.domain.UserRole;
import com.sanoli.fitradar.dto.IssuedAuthTokens;
import com.sanoli.fitradar.dto.ChangePasswordRequest;
import com.sanoli.fitradar.dto.ClientSessionInfo;
import com.sanoli.fitradar.dto.ForgotPasswordRequest;
import com.sanoli.fitradar.dto.LoginRequest;
import com.sanoli.fitradar.dto.MessageResponse;
import com.sanoli.fitradar.dto.RegisterRequest;
import com.sanoli.fitradar.dto.ResetPasswordRequest;
import com.sanoli.fitradar.dto.UpdateProfileRequest;
import com.sanoli.fitradar.exception.BusinessException;
import com.sanoli.fitradar.repository.RefreshTokenRepository;
import com.sanoli.fitradar.repository.AnamneseRepository;
import com.sanoli.fitradar.repository.UserActionTokenRepository;
import com.sanoli.fitradar.repository.UserRepository;
import com.sanoli.fitradar.security.JwtService;
import com.sanoli.fitradar.security.TokenHashUtil;
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
    private AnamneseRepository anamneseRepository;
    private RefreshTokenRepository refreshTokenRepository;
    private UserActionTokenRepository userActionTokenRepository;
    private PasswordEncoder passwordEncoder;
    private JwtService jwtService;
    private TokenService tokenService;
    private AuthService authService;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        anamneseRepository = mock(AnamneseRepository.class);
        refreshTokenRepository = mock(RefreshTokenRepository.class);
        userActionTokenRepository = mock(UserActionTokenRepository.class);
        passwordEncoder = new BCryptPasswordEncoder();
        jwtService = mock(JwtService.class);
        tokenService = mock(TokenService.class);

        authService = new AuthService(
                userRepository,
                anamneseRepository,
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
        when(tokenService.createRefreshToken(any(AppUser.class), any(ClientSessionInfo.class))).thenReturn("refresh-token");
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

        IssuedAuthTokens response = authService.register(
                new RegisterRequest("Creator", EMAIL, PASSWORD, true),
                ClientSessionInfo.UNKNOWN);

        assertThat(response.accessToken()).isEqualTo("jwt-token");
        assertThat(response.refreshToken()).isEqualTo("refresh-token");
        assertThat(response.user().email()).isEqualTo(EMAIL);
        assertThat(response.user().role()).isEqualTo(UserRole.CREATOR);
        assertThat(response.user().termsAccepted()).isTrue();
    }

    @Test
    void register_rejectsWithoutTermsAcceptance() {
        assertThatThrownBy(() -> authService.register(
                new RegisterRequest("Creator", EMAIL, PASSWORD, false), ClientSessionInfo.UNKNOWN))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Termos");
    }

    @Test
    void register_rejectsDuplicateEmail() {
        when(userRepository.existsByEmailIgnoreCase(EMAIL)).thenReturn(true);

        assertThatThrownBy(() -> authService.register(
                new RegisterRequest("Creator", EMAIL, PASSWORD, true), ClientSessionInfo.UNKNOWN))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Já existe");
    }

    @Test
    void login_succeedsWithValidCredentials() {
        AppUser user = savedCreator();
        when(userRepository.findByEmailIgnoreCase(EMAIL)).thenReturn(Optional.of(user));

        IssuedAuthTokens response = authService.login(new LoginRequest(EMAIL, PASSWORD), ClientSessionInfo.UNKNOWN);

        assertThat(response.accessToken()).isEqualTo("jwt-token");
        assertThat(response.user().email()).isEqualTo(EMAIL);
    }

    @Test
    void login_rejectsWrongPassword() {
        AppUser user = savedCreator();
        when(userRepository.findByEmailIgnoreCase(EMAIL)).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> authService.login(new LoginRequest(EMAIL, "wrong"), ClientSessionInfo.UNKNOWN))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    void refresh_rotatesTokenAndReturnsNewAuth() {
        AppUser user = savedCreator();
        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setTokenHash(TokenHashUtil.sha256Hex("old-refresh"));
        refreshToken.setUser(user);
        refreshToken.setExpiresAt(LocalDateTime.now().plusDays(7));
        refreshToken.setRevoked(false);

        when(refreshTokenRepository.findByTokenHashAndRevokedFalse(TokenHashUtil.sha256Hex("old-refresh")))
                .thenReturn(Optional.of(refreshToken));
        when(refreshTokenRepository.save(refreshToken)).thenReturn(refreshToken);

        IssuedAuthTokens response = authService.refresh("old-refresh", ClientSessionInfo.UNKNOWN);

        assertThat(refreshToken.isRevoked()).isTrue();
        assertThat(response.accessToken()).isEqualTo("jwt-token");
        verify(refreshTokenRepository).save(refreshToken);
    }

    @Test
    void refresh_rejectsUnknownToken() {
        when(refreshTokenRepository.findByTokenHashAndRevokedFalse(TokenHashUtil.sha256Hex("bad")))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.refresh("bad", ClientSessionInfo.UNKNOWN))
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
        token.setTokenHash(TokenHashUtil.sha256Hex("reset-token"));
        token.setPurpose(TokenPurpose.PASSWORD_RESET);
        token.setExpiresAt(LocalDateTime.now().plusHours(1));
        token.setUsed(false);

        when(userActionTokenRepository.findByTokenHashAndPurposeAndUsedFalse(
                TokenHashUtil.sha256Hex("reset-token"), TokenPurpose.PASSWORD_RESET))
                .thenReturn(Optional.of(token));
        when(userRepository.save(user)).thenReturn(user);
        when(userActionTokenRepository.save(token)).thenReturn(token);

        MessageResponse response = authService.resetPassword(
                new ResetPasswordRequest("reset-token", "novaSenha12345"));

        assertThat(response.message()).contains("atualizada");
        assertThat(token.isUsed()).isTrue();
        assertThat(passwordEncoder.matches("novaSenha12345", user.getPasswordHash())).isTrue();
        verify(tokenService).revokeAllRefreshTokensForUser(user.getId());
    }

    @Test
    void verifyEmail_marksUserVerified() {
        AppUser user = savedCreator();
        UserActionToken token = new UserActionToken();
        token.setUser(user);
        token.setTokenHash(TokenHashUtil.sha256Hex("verify-token"));
        token.setPurpose(TokenPurpose.EMAIL_VERIFICATION);
        token.setExpiresAt(LocalDateTime.now().plusHours(1));

        when(userActionTokenRepository.findByTokenHashAndPurposeAndUsedFalse(
                TokenHashUtil.sha256Hex("verify-token"), TokenPurpose.EMAIL_VERIFICATION))
                .thenReturn(Optional.of(token));
        when(userRepository.save(user)).thenReturn(user);
        when(userActionTokenRepository.save(token)).thenReturn(token);

        MessageResponse response = authService.verifyEmail("verify-token");

        assertThat(response.message()).contains("verificado");
        assertThat(user.isEmailVerified()).isTrue();
        assertThat(token.isUsed()).isTrue();
    }

    @Test
    void resendVerification_sendsWhenPending() {
        AppUser user = savedCreator();
        user.setEmailVerified(false);
        when(tokenService.createEmailVerificationToken(user)).thenReturn("new-verify-token");

        MessageResponse response = authService.resendVerification(user);

        assertThat(response.message()).contains("link de verificação");
        verify(tokenService).createEmailVerificationToken(user);
    }

    @Test
    void resendVerification_skipsWhenAlreadyVerified() {
        AppUser user = savedCreator();
        user.setEmailVerified(true);

        MessageResponse response = authService.resendVerification(user);

        assertThat(response.message()).contains("já está verificado");
    }

    @Test
    void updateProfile_changesName() {
        AppUser user = savedCreator();
        when(userRepository.save(user)).thenReturn(user);

        var response = authService.updateProfile(user, new UpdateProfileRequest("Novo Nome", EMAIL));

        assertThat(response.name()).isEqualTo("Novo Nome");
        assertThat(user.getName()).isEqualTo("Novo Nome");
    }

    @Test
    void updateProfile_emailChangeRequiresReverification() {
        AppUser user = savedCreator();
        user.setEmailVerified(true);
        when(userRepository.existsByEmailIgnoreCase("novo@test.local")).thenReturn(false);
        when(userRepository.save(user)).thenReturn(user);

        var response = authService.updateProfile(user, new UpdateProfileRequest("Creator", "novo@test.local"));

        assertThat(response.email()).isEqualTo("novo@test.local");
        assertThat(user.isEmailVerified()).isFalse();
    }

    @Test
    void changePassword_requiresCurrentWhenNotForced() {
        AppUser user = savedCreator();

        assertThatThrownBy(() -> authService.changePassword(user, new ChangePasswordRequest(null, "novaSenha12345")))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("senha atual");
    }

    @Test
    void changePassword_succeedsAndClearsMustChangeFlag() {
        AppUser user = savedCreator();
        user.setMustChangePassword(true);
        when(userRepository.save(user)).thenReturn(user);

        MessageResponse response = authService.changePassword(
                user, new ChangePasswordRequest(null, "novaSenha12345"));

        assertThat(response.message()).contains("atualizada");
        assertThat(user.isMustChangePassword()).isFalse();
        assertThat(passwordEncoder.matches("novaSenha12345", user.getPasswordHash())).isTrue();
        verify(tokenService).revokeAllRefreshTokensForUser(user.getId());
    }

    @Test
    void changePassword_validatesCurrentPassword() {
        AppUser user = savedCreator();

        assertThatThrownBy(() -> authService.changePassword(
                user, new ChangePasswordRequest("wrong", "novaSenha12345")))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("incorreta");
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
