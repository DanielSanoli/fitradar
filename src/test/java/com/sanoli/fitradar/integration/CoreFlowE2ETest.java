package com.sanoli.fitradar.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Fluxo central: criador → espaço → programa → treino → convite → matrícula → check-in → radar.
 */
class CoreFlowE2ETest extends AbstractIntegrationTest {

    @Autowired
    MockMvc mockMvc;

    @Autowired
    ObjectMapper objectMapper;

    @Test
    void creatorInviteStudentCheckInAppearsOnRetentionRadar() throws Exception {
        String creatorToken = registerCreator("flow@test.local");

        mockMvc.perform(put("/api/v1/creator-space")
                        .header("Authorization", "Bearer " + creatorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Comunidade Flow","slug":"flow","bio":"Teste E2E","modules":["TRAINING"]}
                                """))
                .andExpect(status().isOk());

        MvcResult programResult = mockMvc.perform(post("/api/v1/programs")
                        .header("Authorization", "Bearer " + creatorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":"Programa Flow","description":"Semanal","active":true,"price":0}
                                """))
                .andExpect(status().isCreated())
                .andReturn();
        String programId = objectMapper.readTree(programResult.getResponse().getContentAsString()).get("id").asText();

        MvcResult workoutResult = mockMvc.perform(post("/api/v1/programs/" + programId + "/workouts")
                        .header("Authorization", "Bearer " + creatorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":"Treino A","description":"","contentMarkdown":"## Treino","dayIndex":0}
                                """))
                .andExpect(status().isCreated())
                .andReturn();
        String workoutId = objectMapper.readTree(workoutResult.getResponse().getContentAsString()).get("id").asText();

        MvcResult inviteResult = mockMvc.perform(post("/api/v1/students")
                        .header("Authorization", "Bearer " + creatorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Aluno Flow","email":"aluno-flow@test.local"}
                                """))
                .andExpect(status().isCreated())
                .andReturn();
        JsonNode inviteBody = objectMapper.readTree(inviteResult.getResponse().getContentAsString());
        String studentId = inviteBody.get("studentId").asText();
        String tempPassword = inviteBody.get("temporaryPassword").asText();

        mockMvc.perform(post("/api/v1/students/" + studentId + "/enrollments")
                        .header("Authorization", "Bearer " + creatorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"programId":"%s"}
                                """.formatted(programId)))
                .andExpect(status().isCreated());

        String studentToken = login("aluno-flow@test.local", tempPassword);

        mockMvc.perform(post("/api/v1/my/check-ins")
                        .header("Authorization", "Bearer " + studentToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"workoutId":"%s","skipped":false}
                                """.formatted(workoutId)))
                .andExpect(status().isCreated());

        MvcResult radarResult = mockMvc.perform(get("/api/v1/retention/students-at-risk?minLevel=LOW")
                        .header("Authorization", "Bearer " + creatorToken))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode radar = objectMapper.readTree(radarResult.getResponse().getContentAsString());
        assertThat(radar.isArray()).isTrue();
        assertThat(radar).anySatisfy(node ->
                assertThat(node.get("studentId").asText()).isEqualTo(studentId));

        MvcResult overviewResult = mockMvc.perform(get("/api/v1/retention/overview")
                        .header("Authorization", "Bearer " + creatorToken))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode overview = objectMapper.readTree(overviewResult.getResponse().getContentAsString());
        assertThat(overview.get("activeStudents").asInt()).isGreaterThanOrEqualTo(1);
        assertThat(overview.get("checkInsThisWeek").asInt()).isGreaterThanOrEqualTo(1);
    }

    private String registerCreator(String email) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Creator Flow","email":"%s","password":"senha12345","acceptedTerms":true}
                                """.formatted(email)))
                .andExpect(status().isCreated())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("token").asText();
    }

    private String login(String email, String password) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"%s","password":"%s"}
                                """.formatted(email, password)))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("token").asText();
    }
}
