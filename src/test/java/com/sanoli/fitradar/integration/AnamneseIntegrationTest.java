package com.sanoli.fitradar.integration;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AnamneseIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    MockMvc mockMvc;

    @Autowired
    IntegrationTestSupport support;

    private IntegrationTestSupport.AuthContext creatorA;
    private IntegrationTestSupport.AuthContext creatorB;
    private IntegrationTestSupport.StudentContext studentA;
    private String studentAToken;

    @BeforeEach
    void setUp() throws Exception {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        creatorA = support.registerCreator("anamnese-a-" + suffix + "@test.local");
        creatorB = support.registerCreator("anamnese-b-" + suffix + "@test.local");
        support.createSpace(creatorA.token(), "anamnese-a-" + suffix);
        studentA = support.inviteStudent(creatorA.token(), "Aluno A", "anamnese-student-" + suffix + "@test.local");
        studentAToken = support.login(studentA.email(), studentA.temporaryPassword());
    }

    @Test
    void studentCannotAccessWorkoutsUntilAnamneseCompleted() throws Exception {
        mockMvc.perform(get("/api/v1/my/workouts")
                        .header("Authorization", "Bearer " + studentAToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("ANAMNESE_REQUIRED"));
    }

    @Test
    void studentCreatesAnamneseAndAccessesWorkouts() throws Exception {
        mockMvc.perform(post("/api/v1/anamnese")
                        .header("Authorization", "Bearer " + studentAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "objetivoPrincipal":"SAUDE",
                                  "experienciaTreino":"INICIANTE",
                                  "diasDisponiveisSemana":3,
                                  "nivelAtividadeRotina":"MODERADO",
                                  "alturaCm":175,
                                  "pesoAtualKg":78.50,
                                  "consentimentoDadosSaude":true
                                }
                                """))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/v1/my/workouts")
                        .header("Authorization", "Bearer " + studentAToken))
                .andExpect(status().isOk());
    }

    @Test
    void creatorBCannotReadCreatorAStudentAnamnese() throws Exception {
        submitAnamnese(studentAToken);

        mockMvc.perform(get("/api/v1/anamnese/student/" + studentA.studentId())
                        .header("Authorization", "Bearer " + creatorB.token()))
                .andExpect(status().isNotFound());
    }

    @Test
    void creatorReadsOwnStudentAnamnese() throws Exception {
        submitAnamnese(studentAToken);

        MvcResult result = mockMvc.perform(get("/api/v1/anamnese/student/" + studentA.studentId())
                        .header("Authorization", "Bearer " + creatorA.token()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode body = support.objectMapper.readTree(result.getResponse().getContentAsString());
        assertThat(body.get("objetivoPrincipal").asText()).isEqualTo("SAUDE");
        assertThat(body.get("studentId").asText()).isEqualTo(studentA.studentId());
    }

    private void submitAnamnese(String token) throws Exception {
        mockMvc.perform(post("/api/v1/anamnese")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "objetivoPrincipal":"SAUDE",
                                  "experienciaTreino":"INICIANTE",
                                  "diasDisponiveisSemana":3,
                                  "nivelAtividadeRotina":"MODERADO",
                                  "alturaCm":175,
                                  "pesoAtualKg":78.50,
                                  "consentimentoDadosSaude":true
                                }
                                """))
                .andExpect(status().isCreated());
    }
}
