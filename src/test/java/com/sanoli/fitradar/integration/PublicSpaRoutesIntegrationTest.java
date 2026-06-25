package com.sanoli.fitradar.integration;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.forwardedUrl;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * SPA pages reachable by direct navigation / e-mail links must not require JWT.
 */
class PublicSpaRoutesIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    MockMvc mockMvc;

    @Test
    void indexHtmlIsServedForSpaShell() throws Exception {
        mockMvc.perform(get("/index.html"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.TEXT_HTML))
                .andExpect(content().string(containsString("FitRadar SPA")));
    }

    @Test
    void publicSpacePageWithoutAuthForwardsToIndexHtml() throws Exception {
        mockMvc.perform(get("/c/studio-teste"))
                .andExpect(status().isOk())
                .andExpect(forwardedUrl("/index.html"));
    }

    @Test
    void forgotPasswordPageWithoutAuthForwardsToIndexHtml() throws Exception {
        mockMvc.perform(get("/forgot-password"))
                .andExpect(status().isOk())
                .andExpect(forwardedUrl("/index.html"));
    }

    @Test
    void loginVerifyQueryWithoutAuthForwardsToIndexHtml() throws Exception {
        mockMvc.perform(get("/login").queryParam("verify", "token-abc"))
                .andExpect(status().isOk())
                .andExpect(forwardedUrl("/index.html"));
    }

    @Test
    void loginResetQueryWithoutAuthForwardsToIndexHtml() throws Exception {
        mockMvc.perform(get("/login").queryParam("reset", "token-xyz"))
                .andExpect(status().isOk())
                .andExpect(forwardedUrl("/index.html"));
    }
}
