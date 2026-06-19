package com.sanoli.fitradar.integration;

import org.junit.jupiter.api.Test;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class CopilotDegradationIntegrationTest extends AbstractIntegrationTest {

    @DynamicPropertySource
    static void enableCopilot(DynamicPropertyRegistry registry) {
        registry.add("app.copilot.enabled", () -> "true");
        registry.add("spring.ai.openai.api-key", () -> "test-key");
    }

    @Autowired
    MockMvc mockMvc;

    @Autowired
    IntegrationTestSupport support;

    @MockBean
    ChatModel chatModel;

    @Test
    void askReturnsOkWhenOpenAiFails() throws Exception {
        when(chatModel.call(any(Prompt.class))).thenThrow(new RuntimeException("OpenAI indisponível"));

        String suffix = UUID.randomUUID().toString().substring(0, 8);
        IntegrationTestSupport.AuthContext creator =
                support.registerCreator("copilot-fail-" + suffix + "@test.local");

        mockMvc.perform(post("/api/v1/copilot/ask")
                        .header("Authorization", "Bearer " + creator.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"question":"Quais alunos estão em risco de desistir?"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.answer").isNotEmpty())
                .andExpect(jsonPath("$.usedFunction").value("studentsAtRisk"));
    }
}
