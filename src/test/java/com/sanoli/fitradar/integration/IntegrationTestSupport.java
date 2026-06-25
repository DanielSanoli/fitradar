package com.sanoli.fitradar.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Component
class IntegrationTestSupport {

    @Autowired
    MockMvc mockMvc;

    @Autowired
    ObjectMapper objectMapper;

    record AuthContext(String token, String email, String userId) {
    }

    record ProgramContext(String programId, String workoutId) {
    }

    record StudentContext(String studentId, String email, String temporaryPassword) {
    }

    AuthContext registerCreator(String email) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Creator","email":"%s","password":"senha12345","acceptedTerms":true}
                                """.formatted(email)))
                .andExpect(status().isCreated())
                .andReturn();
        JsonNode body = objectMapper.readTree(result.getResponse().getContentAsString());
        return new AuthContext(body.get("token").asText(), email, body.get("user").get("id").asText());
    }

    String login(String email, String password) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"%s","password":"%s"}
                                """.formatted(email, password)))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("token").asText();
    }

    void createSpace(String creatorToken, String slug) throws Exception {
        mockMvc.perform(put("/api/v1/creator-space")
                        .header("Authorization", "Bearer " + creatorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Espaco %s","slug":"%s","bio":"Teste"}
                                """.formatted(slug, slug)))
                .andExpect(status().isOk());
    }

    ProgramContext createProgramWithWorkout(String creatorToken, String title) throws Exception {
        MvcResult programResult = mockMvc.perform(post("/api/v1/programs")
                        .header("Authorization", "Bearer " + creatorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":"%s","description":"Desc","active":true,"price":0}
                                """.formatted(title)))
                .andExpect(status().isCreated())
                .andReturn();
        String programId = objectMapper.readTree(programResult.getResponse().getContentAsString()).get("id").asText();

        MvcResult workoutResult = mockMvc.perform(post("/api/v1/programs/" + programId + "/workouts")
                        .header("Authorization", "Bearer " + creatorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":"Treino 1","description":"","contentMarkdown":"## Treino","dayIndex":0}
                                """))
                .andExpect(status().isCreated())
                .andReturn();
        String workoutId = objectMapper.readTree(workoutResult.getResponse().getContentAsString()).get("id").asText();
        return new ProgramContext(programId, workoutId);
    }

    StudentContext inviteStudent(String creatorToken, String name, String email) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/students")
                        .header("Authorization", "Bearer " + creatorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"%s","email":"%s"}
                                """.formatted(name, email)))
                .andExpect(status().isCreated())
                .andReturn();
        JsonNode body = objectMapper.readTree(result.getResponse().getContentAsString());
        return new StudentContext(
                body.get("studentId").asText(),
                email,
                body.get("temporaryPassword").asText()
        );
    }

    void enrollStudent(String creatorToken, String studentId, String programId) throws Exception {
        mockMvc.perform(post("/api/v1/students/" + studentId + "/enrollments")
                        .header("Authorization", "Bearer " + creatorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"programId":"%s"}
                                """.formatted(programId)))
                .andExpect(status().isCreated());
    }
}
