package com.sanoli.fitradar.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sanoli.fitradar.dto.AcceptTermsRequest;
import com.sanoli.fitradar.dto.AccountDataExportResponse;
import com.sanoli.fitradar.dto.AuthResponse;
import com.sanoli.fitradar.dto.ChangePasswordRequest;
import com.sanoli.fitradar.dto.ClientSessionInfo;
import com.sanoli.fitradar.dto.DeleteAccountRequest;
import com.sanoli.fitradar.dto.ForgotPasswordRequest;
import com.sanoli.fitradar.dto.LoginRequest;
import com.sanoli.fitradar.dto.LogoutRequest;
import com.sanoli.fitradar.dto.MessageResponse;
import com.sanoli.fitradar.dto.RefreshTokenRequest;
import com.sanoli.fitradar.dto.RegisterRequest;
import com.sanoli.fitradar.dto.ResetPasswordRequest;
import com.sanoli.fitradar.dto.SessionResponse;
import com.sanoli.fitradar.dto.UpdateProfileRequest;
import com.sanoli.fitradar.dto.UserResponse;
import com.sanoli.fitradar.security.CurrentUserService;
import com.sanoli.fitradar.service.AccountPrivacyService;
import com.sanoli.fitradar.service.AuthService;
import com.sanoli.fitradar.service.SessionService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;
    private final SessionService sessionService;
    private final AccountPrivacyService accountPrivacyService;
    private final CurrentUserService currentUserService;
    private final ObjectMapper objectMapper;

    public AuthController(
            AuthService authService,
            SessionService sessionService,
            AccountPrivacyService accountPrivacyService,
            CurrentUserService currentUserService,
            ObjectMapper objectMapper
    ) {
        this.authService = authService;
        this.sessionService = sessionService;
        this.accountPrivacyService = accountPrivacyService;
        this.currentUserService = currentUserService;
        this.objectMapper = objectMapper;
    }

    @PostMapping("/register")
    @Operation(summary = "Cria uma conta de criador")
    public ResponseEntity<AuthResponse> register(
            @Valid @RequestBody RegisterRequest request,
            HttpServletRequest httpRequest
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(authService.register(request, ClientSessionInfo.from(httpRequest)));
    }

    @PostMapping("/login")
    @Operation(summary = "Autentica um usuário (criador ou aluno)")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest
    ) {
        return ResponseEntity.ok(authService.login(request, ClientSessionInfo.from(httpRequest)));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Renova o token JWT usando refresh token")
    public ResponseEntity<AuthResponse> refresh(
            @Valid @RequestBody RefreshTokenRequest request,
            HttpServletRequest httpRequest
    ) {
        return ResponseEntity.ok(authService.refresh(request, ClientSessionInfo.from(httpRequest)));
    }

    @PostMapping("/logout")
    @Operation(summary = "Encerra a sessão atual revogando o refresh token")
    public ResponseEntity<MessageResponse> logout(@Valid @RequestBody LogoutRequest request) {
        return ResponseEntity.ok(sessionService.logout(request.refreshToken()));
    }

    @GetMapping("/sessions")
    @Operation(summary = "Lista sessões ativas do usuário autenticado")
    public ResponseEntity<List<SessionResponse>> listSessions(
            @RequestHeader(value = "X-Refresh-Token", required = false) String refreshToken
    ) {
        return ResponseEntity.ok(sessionService.listActiveSessions(
                currentUserService.getCurrentUser(),
                refreshToken
        ));
    }

    @DeleteMapping("/sessions/{sessionId}")
    @Operation(summary = "Encerra uma sessão específica")
    public ResponseEntity<MessageResponse> revokeSession(
            @PathVariable UUID sessionId,
            @RequestHeader(value = "X-Refresh-Token", required = false) String refreshToken
    ) {
        return ResponseEntity.ok(sessionService.revokeSession(
                currentUserService.getCurrentUser(),
                sessionId,
                refreshToken
        ));
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Solicita recuperação de senha")
    public ResponseEntity<MessageResponse> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        return ResponseEntity.ok(authService.forgotPassword(request));
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Redefine a senha com token de recuperação")
    public ResponseEntity<MessageResponse> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        return ResponseEntity.ok(authService.resetPassword(request));
    }

    @GetMapping("/verify-email")
    @Operation(summary = "Confirma o email do usuário")
    public ResponseEntity<MessageResponse> verifyEmail(@RequestParam String token) {
        return ResponseEntity.ok(authService.verifyEmail(token));
    }

    @PostMapping("/resend-verification")
    @Operation(summary = "Reenvia o link de verificação de e-mail do usuário autenticado")
    public ResponseEntity<MessageResponse> resendVerification() {
        return ResponseEntity.ok(authService.resendVerification(currentUserService.getCurrentUser()));
    }

    @PatchMapping("/profile")
    @Operation(summary = "Atualiza nome e e-mail do usuário autenticado")
    public ResponseEntity<UserResponse> updateProfile(@Valid @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(authService.updateProfile(currentUserService.getCurrentUser(), request));
    }

    @PostMapping("/change-password")
    @Operation(summary = "Altera a senha do usuário autenticado")
    public ResponseEntity<MessageResponse> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        return ResponseEntity.ok(authService.changePassword(currentUserService.getCurrentUser(), request));
    }

    @GetMapping("/me")
    @Operation(summary = "Retorna o usuário autenticado")
    public ResponseEntity<UserResponse> me() {
        return ResponseEntity.ok(UserResponse.fromEntity(currentUserService.getCurrentUser()));
    }

    @PostMapping("/accept-terms")
    @Operation(summary = "Registra aceite dos Termos de Uso")
    public ResponseEntity<MessageResponse> acceptTerms(@Valid @RequestBody AcceptTermsRequest request) {
        return ResponseEntity.ok(authService.acceptTerms(currentUserService.getCurrentUser(), request));
    }

    @GetMapping(value = "/me/export", produces = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Exporta dados pessoais do titular (LGPD)")
    public ResponseEntity<byte[]> exportMyData() throws com.fasterxml.jackson.core.JsonProcessingException {
        AccountDataExportResponse export = accountPrivacyService.exportData(currentUserService.getCurrentUser());
        byte[] body = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsBytes(export);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"fitradar-meus-dados.json\"")
                .contentType(MediaType.APPLICATION_JSON)
                .body(body);
    }

    @DeleteMapping("/me")
    @Operation(summary = "Exclui ou anonimiza a conta do titular (LGPD)")
    public ResponseEntity<MessageResponse> deleteMyAccount(@Valid @RequestBody DeleteAccountRequest request) {
        accountPrivacyService.deleteAccount(currentUserService.getCurrentUser(), request);
        return ResponseEntity.ok(new MessageResponse("Conta excluída. Seus dados foram removidos conforme a LGPD."));
    }
}
