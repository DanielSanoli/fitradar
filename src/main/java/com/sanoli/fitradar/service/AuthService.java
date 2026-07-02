package com.sanoli.fitradar.service;

import com.sanoli.fitradar.domain.AppUser;
import com.sanoli.fitradar.domain.RefreshToken;
import com.sanoli.fitradar.domain.TokenPurpose;
import com.sanoli.fitradar.domain.UserActionToken;
import com.sanoli.fitradar.domain.UserRole;
import com.sanoli.fitradar.dto.AcceptTermsRequest;
import com.sanoli.fitradar.dto.ChangePasswordRequest;
import com.sanoli.fitradar.dto.ClientSessionInfo;
import com.sanoli.fitradar.dto.ForgotPasswordRequest;
import com.sanoli.fitradar.dto.LoginRequest;
import com.sanoli.fitradar.dto.MessageResponse;
import com.sanoli.fitradar.dto.IssuedAuthTokens;
import com.sanoli.fitradar.dto.RegisterRequest;
import com.sanoli.fitradar.dto.ResetPasswordRequest;
import com.sanoli.fitradar.dto.UpdateProfileRequest;
import com.sanoli.fitradar.dto.UserResponse;
import com.sanoli.fitradar.exception.BusinessException;
import com.sanoli.fitradar.legal.LegalConstants;
import com.sanoli.fitradar.repository.RefreshTokenRepository;
import com.sanoli.fitradar.repository.AnamneseRepository;
import com.sanoli.fitradar.repository.UserActionTokenRepository;
import com.sanoli.fitradar.repository.UserRepository;
import com.sanoli.fitradar.security.JwtService;
import com.sanoli.fitradar.security.TokenHashUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final AnamneseRepository anamneseRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final UserActionTokenRepository userActionTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final TokenService tokenService;
    private final EmailService emailService;
    private final LoginRateLimiter loginRateLimiter;
    private final String publicBaseUrl;

    public AuthService(
            UserRepository userRepository,
            AnamneseRepository anamneseRepository,
            RefreshTokenRepository refreshTokenRepository,
            UserActionTokenRepository userActionTokenRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            TokenService tokenService,
            EmailService emailService,
            LoginRateLimiter loginRateLimiter,
            @Value("${app.public-base-url:http://localhost:8080}") String publicBaseUrl
    ) {
        this.userRepository = userRepository;
        this.anamneseRepository = anamneseRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.userActionTokenRepository = userActionTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.tokenService = tokenService;
        this.emailService = emailService;
        this.loginRateLimiter = loginRateLimiter;
        this.publicBaseUrl = publicBaseUrl;
    }

    @Transactional
    public IssuedAuthTokens register(RegisterRequest request, ClientSessionInfo sessionInfo) {
        if (request.acceptedTerms() == null || !request.acceptedTerms()) {
            throw new BusinessException("Aceite os Termos de Uso para continuar");
        }
        String email = normalizeEmail(request.email());
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new BusinessException("Já existe um usuário com este email");
        }

        AppUser user = new AppUser();
        user.setName(request.name().trim());
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(UserRole.CREATOR);
        applyTermsAcceptance(user);
        AppUser savedUser = userRepository.save(user);

        String verificationToken = tokenService.createEmailVerificationToken(savedUser);
        try {
            emailService.sendEmailVerification(email, publicBaseUrl + "/login?verify=" + verificationToken);
        } catch (RuntimeException exception) {
            log.warn("Falha ao enviar e-mail de verificação para conta terminando em {}", maskEmail(email));
        }

        return issueAuthTokens(savedUser, sessionInfo);
    }

    @Transactional
    public IssuedAuthTokens login(LoginRequest request, ClientSessionInfo sessionInfo) {
        String email = normalizeEmail(request.email());
        loginRateLimiter.checkAllowed(email);

        AppUser user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> {
                    loginRateLimiter.registerFailure(email);
                    return new BusinessException("Email ou senha inválidos");
                });

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            loginRateLimiter.registerFailure(email);
            throw new BusinessException("Email ou senha inválidos");
        }

        loginRateLimiter.reset(email);
        return issueAuthTokens(user, sessionInfo);
    }

    @Transactional
    public IssuedAuthTokens refresh(String refreshTokenValue, ClientSessionInfo sessionInfo) {
        RefreshToken refreshToken = refreshTokenRepository
                .findByTokenHashAndRevokedFalse(TokenHashUtil.sha256Hex(refreshTokenValue))
                .orElseThrow(() -> new BusinessException("Refresh token inválido"));

        if (refreshToken.isExpired()) {
            refreshToken.setRevoked(true);
            throw new BusinessException("Refresh token expirado");
        }

        refreshToken.setRevoked(true);
        refreshTokenRepository.save(refreshToken);
        return issueAuthTokens(refreshToken.getUser(), sessionInfo);
    }

    @Transactional
    public MessageResponse forgotPassword(ForgotPasswordRequest request) {
        userRepository.findByEmailIgnoreCase(normalizeEmail(request.email())).ifPresent(user -> {
            String token = tokenService.createPasswordResetToken(user);
            try {
                emailService.sendPasswordResetEmail(user.getEmail(), publicBaseUrl + "/login?reset=" + token);
            } catch (RuntimeException exception) {
                log.error("Falha ao enviar e-mail de recuperação para conta terminando em {}", maskEmail(user.getEmail()));
            }
        });
        return new MessageResponse("Se o email existir, enviaremos instruções de recuperação.");
    }

    @Transactional
    public MessageResponse resetPassword(ResetPasswordRequest request) {
        UserActionToken token = userActionTokenRepository
                .findByTokenHashAndPurposeAndUsedFalse(
                        TokenHashUtil.sha256Hex(request.token()),
                        TokenPurpose.PASSWORD_RESET)
                .orElseThrow(() -> new BusinessException("Token de recuperação inválido"));

        if (token.isExpired()) {
            throw new BusinessException("Token de recuperação expirado");
        }

        AppUser user = token.getUser();
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setMustChangePassword(false);
        token.setUsed(true);
        tokenService.revokeAllRefreshTokensForUser(user.getId());
        userRepository.save(user);
        userActionTokenRepository.save(token);
        return new MessageResponse("Senha atualizada com sucesso.");
    }

    @Transactional
    public MessageResponse verifyEmail(String tokenValue) {
        UserActionToken token = userActionTokenRepository
                .findByTokenHashAndPurposeAndUsedFalse(
                        TokenHashUtil.sha256Hex(tokenValue),
                        TokenPurpose.EMAIL_VERIFICATION)
                .orElseThrow(() -> new BusinessException("Token de verificação inválido"));

        if (token.isExpired()) {
            throw new BusinessException("Token de verificação expirado");
        }

        AppUser user = token.getUser();
        user.setEmailVerified(true);
        token.setUsed(true);
        userRepository.save(user);
        userActionTokenRepository.save(token);
        return new MessageResponse("Email verificado com sucesso.");
    }

    @Transactional
    public MessageResponse resendVerification(AppUser user) {
        if (user.isEmailVerified()) {
            return new MessageResponse("Seu e-mail já está verificado.");
        }
        if (user.getEmail() == null || user.getEmail().isBlank()) {
            throw new BusinessException("Conta sem e-mail cadastrado.");
        }

        String verificationToken = tokenService.createEmailVerificationToken(user);
        try {
            emailService.sendEmailVerification(
                    user.getEmail(),
                    publicBaseUrl + "/login?verify=" + verificationToken
            );
        } catch (RuntimeException exception) {
            log.warn("Falha ao reenviar verificação para conta terminando em {}", maskEmail(user.getEmail()));
            throw new BusinessException("Não foi possível enviar o e-mail de verificação. Tente novamente.");
        }
        return new MessageResponse("Enviamos um novo link de verificação para seu e-mail.");
    }

    @Transactional
    public UserResponse updateProfile(AppUser user, UpdateProfileRequest request) {
        String name = request.name().trim();
        if (name.isEmpty()) {
            throw new BusinessException("Nome é obrigatório");
        }

        String email = normalizeEmail(request.email());
        boolean emailChanged = !email.equalsIgnoreCase(user.getEmail());
        if (emailChanged && userRepository.existsByEmailIgnoreCase(email)) {
            throw new BusinessException("Já existe um usuário com este email");
        }

        user.setName(name);
        if (emailChanged) {
            user.setEmail(email);
            user.setEmailVerified(false);
            String verificationToken = tokenService.createEmailVerificationToken(user);
            try {
                emailService.sendEmailVerification(
                        email,
                        publicBaseUrl + "/login?verify=" + verificationToken
                );
            } catch (RuntimeException exception) {
                log.warn("Falha ao enviar verificação após troca de e-mail para {}", maskEmail(email));
            }
        }

        AppUser saved = userRepository.save(user);
        return toUserResponse(saved);
    }

    @Transactional
    public MessageResponse changePassword(AppUser user, ChangePasswordRequest request) {
        if (!user.isMustChangePassword()) {
            if (request.currentPassword() == null || request.currentPassword().isBlank()) {
                throw new BusinessException("Informe a senha atual");
            }
            if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
                throw new BusinessException("Senha atual incorreta");
            }
        }

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        user.setMustChangePassword(false);
        tokenService.revokeAllRefreshTokensForUser(user.getId());
        userRepository.save(user);
        return new MessageResponse("Senha atualizada com sucesso.");
    }

    @Transactional
    public MessageResponse acceptTerms(AppUser user, AcceptTermsRequest request) {
        if (user.hasAcceptedTerms()) {
            return new MessageResponse("Termos já aceitos.");
        }
        if (request.acceptedTerms() == null || !request.acceptedTerms()) {
            throw new BusinessException("Aceite os Termos de Uso para continuar");
        }
        applyTermsAcceptance(user);
        userRepository.save(user);
        return new MessageResponse("Termos aceitos com sucesso.");
    }

    private void applyTermsAcceptance(AppUser user) {
        user.setTermsAcceptedAt(LocalDateTime.now());
        user.setTermsVersion(LegalConstants.TERMS_VERSION);
    }

    private IssuedAuthTokens issueAuthTokens(AppUser user, ClientSessionInfo sessionInfo) {
        String refreshToken = tokenService.createRefreshToken(user, sessionInfo);
        return new IssuedAuthTokens(
                jwtService.generateToken(user),
                refreshToken,
                toUserResponse(user)
        );
    }

    public UserResponse toUserResponse(AppUser user) {
        boolean anamneseCompleted = user.getRole() != UserRole.STUDENT
                || anamneseRepository.existsByStudentId(user.getId());
        return UserResponse.fromEntity(user, anamneseCompleted);
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase();
    }

    private String maskEmail(String email) {
        if (email == null || !email.contains("@")) {
            return "***";
        }
        return "*" + email.substring(email.indexOf('@'));
    }
}
