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
import com.sanoli.fitradar.dto.UserResponse;
import com.sanoli.fitradar.exception.BusinessException;
import com.sanoli.fitradar.repository.RefreshTokenRepository;
import com.sanoli.fitradar.repository.UserActionTokenRepository;
import com.sanoli.fitradar.repository.UserRepository;
import com.sanoli.fitradar.security.JwtService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
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
    public AuthResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.email());
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new BusinessException("Já existe um usuário com este email");
        }

        AppUser user = new AppUser();
        user.setName(request.name().trim());
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(UserRole.CREATOR);
        AppUser savedUser = userRepository.save(user);

        String verificationToken = tokenService.createEmailVerificationToken(savedUser);
        try {
            emailService.sendEmailVerification(email, publicBaseUrl + "/login?verify=" + verificationToken);
        } catch (RuntimeException exception) {
            log.warn("Falha ao enviar e-mail de verificação para conta terminando em {}", maskEmail(email));
        }

        return toAuthResponse(savedUser);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
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
        return toAuthResponse(user);
    }

    @Transactional
    public AuthResponse refresh(RefreshTokenRequest request) {
        RefreshToken refreshToken = refreshTokenRepository.findByTokenAndRevokedFalse(request.refreshToken())
                .orElseThrow(() -> new BusinessException("Refresh token inválido"));

        if (refreshToken.isExpired()) {
            refreshToken.setRevoked(true);
            throw new BusinessException("Refresh token expirado");
        }

        refreshToken.setRevoked(true);
        refreshTokenRepository.save(refreshToken);
        return toAuthResponse(refreshToken.getUser());
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
                .findByTokenAndPurposeAndUsedFalse(request.token(), TokenPurpose.PASSWORD_RESET)
                .orElseThrow(() -> new BusinessException("Token de recuperação inválido"));

        if (token.isExpired()) {
            throw new BusinessException("Token de recuperação expirado");
        }

        AppUser user = token.getUser();
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        token.setUsed(true);
        userRepository.save(user);
        userActionTokenRepository.save(token);
        return new MessageResponse("Senha atualizada com sucesso.");
    }

    @Transactional
    public MessageResponse verifyEmail(String tokenValue) {
        UserActionToken token = userActionTokenRepository
                .findByTokenAndPurposeAndUsedFalse(tokenValue, TokenPurpose.EMAIL_VERIFICATION)
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

    private AuthResponse toAuthResponse(AppUser user) {
        String refreshToken = tokenService.createRefreshToken(user);
        return AuthResponse.bearer(jwtService.generateToken(user), refreshToken, UserResponse.fromEntity(user));
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
