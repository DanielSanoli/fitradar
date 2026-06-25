package com.sanoli.fitradar.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sanoli.fitradar.domain.TokenPurpose;
import com.sanoli.fitradar.domain.UserActionToken;
import com.sanoli.fitradar.repository.RefreshTokenRepository;
import com.sanoli.fitradar.repository.UserActionTokenRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AuthIntegrationTest extends AbstractIntegrationTest {

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

    @Test
    void verifyEmailWithValidTokenMarksUserVerified() throws Exception {
        String email = "verify-flow@test.local";
        var registered = support.registerCreator(email);

        String tokenValue = userActionTokenRepository.findAll().stream()
                .filter(t -> t.getPurpose() == TokenPurpose.EMAIL_VERIFICATION
                        && t.getUser().getId().toString().equals(registered.userId()))
                .map(UserActionToken::getToken)
                .findFirst()
                .orElseThrow();

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

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"auth-flow@test.local","password":"senha12345"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.refreshToken").isNotEmpty());

        String rt = objectMapper.readTree(mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"auth-flow@test.local","password":"senha12345"}
                                """))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString()).get("refreshToken").asText();

        mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"refreshToken":"%s"}
                                """.formatted(rt)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty());

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

        String refreshToken = objectMapper.readTree(mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"%s","password":"senha12345"}
                                """.formatted(email)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString()).get("refreshToken").asText();

        mockMvc.perform(post("/api/v1/auth/logout")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"refreshToken":"%s"}
                                """.formatted(refreshToken)))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"refreshToken":"%s"}
                                """.formatted(refreshToken)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void listAndRevokeSessions() throws Exception {
        String email = "sessions-flow@test.local";
        var registered = support.registerCreator(email);

        String refreshToken = objectMapper.readTree(mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"%s","password":"senha12345"}
                                """.formatted(email)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString()).get("refreshToken").asText();

        mockMvc.perform(get("/api/v1/auth/sessions")
                        .header("Authorization", "Bearer " + registered.token())
                        .header("X-Refresh-Token", refreshToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].current").value(true));

        String otherSessionId = refreshTokenRepository.findAll().stream()
                .filter(token -> token.getUser().getId().toString().equals(registered.userId()))
                .filter(token -> !token.getToken().equals(refreshToken) && !token.isRevoked())
                .findFirst()
                .orElseThrow()
                .getId()
                .toString();

        mockMvc.perform(delete("/api/v1/auth/sessions/" + otherSessionId)
                        .header("Authorization", "Bearer " + registered.token())
                        .header("X-Refresh-Token", refreshToken))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/auth/sessions")
                        .header("Authorization", "Bearer " + registered.token())
                        .header("X-Refresh-Token", refreshToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }
}
