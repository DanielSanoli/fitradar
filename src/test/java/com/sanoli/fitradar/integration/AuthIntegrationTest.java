package com.sanoli.fitradar.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sanoli.fitradar.domain.TokenPurpose;
import com.sanoli.fitradar.domain.UserActionToken;
import com.sanoli.fitradar.repository.RefreshTokenRepository;
import com.sanoli.fitradar.repository.UserActionTokenRepository;
import com.sanoli.fitradar.repository.UserRepository;
import com.sanoli.fitradar.security.TokenHashUtil;
import com.sanoli.fitradar.service.TokenService;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AuthIntegrationTest extends AbstractIntegrationTest {

    private static final String REFRESH_COOKIE = "fitradar_refresh";

    @Autowired
    MockMvc mockMvc;

    @Autowired
    IntegrationTestSupport support;

    @Autowired
    ObjectMapper objectMapper;

    @Autowired
    UserActionTokenRepository userActionTokenRepository;

    @Autowired
    RefreshTokenRepository refreshTokenRepository;

    @Autowired
    TokenService tokenService;

    @Autowired
    UserRepository userRepository;

    @Test
    void verifyEmailWithValidTokenMarksUserVerified() throws Exception {
        String email = "verify-flow@test.local";
        var registered = support.registerCreator(email);
        var user = userRepository.findById(java.util.UUID.fromString(registered.userId())).orElseThrow();
        String tokenValue = tokenService.createEmailVerificationToken(user);

        mockMvc.perform(get("/api/v1/auth/verify-email").param("token", tokenValue))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Email verificado com sucesso."));

        mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + registered.token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.emailVerified").value(true));
    }

    @Test
    void resendVerificationForPendingEmailSucceeds() throws Exception {
        String email = "resend-verify@test.local";
        var registered = support.registerCreator(email);

        mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + registered.token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.emailVerified").value(false));

        mockMvc.perform(post("/api/v1/auth/resend-verification")
                        .header("Authorization", "Bearer " + registered.token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Enviamos um novo link de verificação para seu e-mail."));

        long tokens = userActionTokenRepository.findAll().stream()
                .filter(t -> t.getPurpose() == TokenPurpose.EMAIL_VERIFICATION
                        && t.getUser().getId().toString().equals(registered.userId()))
                .count();
        assertThat(tokens).isGreaterThanOrEqualTo(2);
    }

    @Test
    void registerLoginAndRefreshSucceed() throws Exception {
        var registered = support.registerCreator("auth-flow@test.local");

        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"auth-flow@test.local","password":"senha12345"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.refreshToken").doesNotExist())
                .andExpect(cookie().httpOnly(REFRESH_COOKIE, true))
                .andReturn();

        Cookie refreshCookie = requireRefreshCookie(loginResult);

        mockMvc.perform(post("/api/v1/auth/refresh").cookie(refreshCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.refreshToken").doesNotExist())
                .andExpect(cookie().httpOnly(REFRESH_COOKIE, true));

        mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + registered.token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("auth-flow@test.local"));
    }

    @Test
    void forgotPasswordAlwaysReturnsSuccessMessage() throws Exception {
        support.registerCreator("forgot@test.local");

        mockMvc.perform(post("/api/v1/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"forgot@test.local"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").isNotEmpty());
    }

    @Test
    void resetPasswordWithInvalidTokenReturnsBadRequest() throws Exception {
        mockMvc.perform(post("/api/v1/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"token":"invalid-token","password":"novaSenha12345"}
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void protectedEndpointWithoutTokenReturnsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/v1/auth/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void protectedEndpointWithInvalidTokenReturnsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer invalid.jwt.token"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void logoutRevokesRefreshToken() throws Exception {
        String email = "logout-flow@test.local";
        support.registerCreator(email);

        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"%s","password":"senha12345"}
                                """.formatted(email)))
                .andExpect(status().isOk())
                .andReturn();

        Cookie refreshCookie = requireRefreshCookie(loginResult);

        mockMvc.perform(post("/api/v1/auth/logout").cookie(refreshCookie))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/auth/refresh").cookie(refreshCookie))
                .andExpect(status().isBadRequest());
    }

    @Test
    void listAndRevokeSessions() throws Exception {
        String email = "sessions-flow@test.local";
        var registered = support.registerCreator(email);

        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"%s","password":"senha12345"}
                                """.formatted(email)))
                .andExpect(status().isOk())
                .andReturn();

        Cookie refreshCookie = requireRefreshCookie(loginResult);
        String refreshTokenValue = refreshCookie.getValue();

        mockMvc.perform(get("/api/v1/auth/sessions")
                        .header("Authorization", "Bearer " + registered.token())
                        .cookie(refreshCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].current").value(true));

        String otherSessionId = refreshTokenRepository.findAll().stream()
                .filter(token -> token.getUser().getId().toString().equals(registered.userId()))
                .filter(token -> !token.getTokenHash().equals(TokenHashUtil.sha256Hex(refreshTokenValue)) && !token.isRevoked())
                .findFirst()
                .orElseThrow()
                .getId()
                .toString();

        mockMvc.perform(delete("/api/v1/auth/sessions/" + otherSessionId)
                        .header("Authorization", "Bearer " + registered.token())
                        .cookie(refreshCookie))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/auth/sessions")
                        .header("Authorization", "Bearer " + registered.token())
                        .cookie(refreshCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    private Cookie requireRefreshCookie(MvcResult result) {
        Cookie cookie = result.getResponse().getCookie(REFRESH_COOKIE);
        assertThat(cookie).isNotNull();
        assertThat(cookie.getValue()).isNotBlank();
        return cookie;
    }
}
