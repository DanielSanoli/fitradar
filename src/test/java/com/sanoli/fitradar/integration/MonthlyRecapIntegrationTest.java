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

class MonthlyRecapIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    MockMvc mockMvc;

    @Autowired
    IntegrationTestSupport support;

    private IntegrationTestSupport.AuthContext creatorA;
    private IntegrationTestSupport.AuthContext creatorB;
    private IntegrationTestSupport.ProgramContext programA;
    private IntegrationTestSupport.StudentContext studentA;
    private IntegrationTestSupport.StudentContext studentB;
    private String studentAToken;
    private String studentBToken;

    @BeforeEach
    void setUpTenants() throws Exception {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        creatorA = support.registerCreator("recap-a-" + suffix + "@test.local");
        creatorB = support.registerCreator("recap-b-" + suffix + "@test.local");
        support.createSpace(creatorA.token(), "recap-a-" + suffix);
        support.createSpace(creatorB.token(), "recap-b-" + suffix);
        programA = support.createProgramWithWorkout(creatorA.token(), "Programa Recap A");
        studentA = support.inviteStudent(creatorA.token(), "Aluno Recap A", "recap-a-student-" + suffix + "@test.local");
        studentB = support.inviteStudent(creatorB.token(), "Aluno Recap B", "recap-b-student-" + suffix + "@test.local");
        support.enrollStudent(creatorA.token(), studentA.studentId(), programA.programId());
        studentAToken = support.login(studentA.email(), studentA.temporaryPassword());
        studentBToken = support.login(studentB.email(), studentB.temporaryPassword());
        submitAnamnese(studentAToken);
        submitAnamnese(studentBToken);
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

    @Test
    void studentGetsOwnRecapWithCheckInsInClosedMonth() throws Exception {
        mockMvc.perform(post("/api/v1/my/check-ins")
                        .header("Authorization", "Bearer " + studentAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"workoutId":"%s","date":"2026-06-10","skipped":false}
                                """.formatted(programA.workoutId())))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/v1/my/check-ins")
                        .header("Authorization", "Bearer " + studentAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"workoutId":"%s","date":"2026-06-11","skipped":false}
                                """.formatted(programA.workoutId())))
                .andExpect(status().isCreated());

        MvcResult result = mockMvc.perform(get("/api/v1/my/recap")
                        .header("Authorization", "Bearer " + studentAToken)
                        .param("year", "2026")
                        .param("month", "6"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hasData").value(true))
                .andExpect(jsonPath("$.workoutsDone").value(2))
                .andExpect(jsonPath("$.xpEarned").value(20))
                .andExpect(jsonPath("$.branding.spaceName").exists())
                .andReturn();

        JsonNode body = support.objectMapper.readTree(result.getResponse().getContentAsString());
        assertThat(body.get("monthLabel").asText()).isNotBlank();
    }

    @Test
    void studentCannotAccessOtherStudentRecapData() throws Exception {
        mockMvc.perform(post("/api/v1/my/check-ins")
                        .header("Authorization", "Bearer " + studentAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"workoutId":"%s","date":"2026-06-15","skipped":false}
                                """.formatted(programA.workoutId())))
                .andExpect(status().isCreated());

        MvcResult studentARecap = mockMvc.perform(get("/api/v1/my/recap")
                        .header("Authorization", "Bearer " + studentAToken)
                        .param("year", "2026")
                        .param("month", "6"))
                .andExpect(status().isOk())
                .andReturn();

        MvcResult studentBRecap = mockMvc.perform(get("/api/v1/my/recap")
                        .header("Authorization", "Bearer " + studentBToken)
                        .param("year", "2026")
                        .param("month", "6"))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode a = support.objectMapper.readTree(studentARecap.getResponse().getContentAsString());
        JsonNode b = support.objectMapper.readTree(studentBRecap.getResponse().getContentAsString());

        assertThat(a.get("workoutsDone").asInt()).isEqualTo(1);
        assertThat(b.get("hasData").asBoolean()).isFalse();
        assertThat(b.get("workoutsDone").asInt()).isZero();
    }

    @Test
    void openMonthIsRejected() throws Exception {
        mockMvc.perform(get("/api/v1/my/recap")
                        .header("Authorization", "Bearer " + studentAToken)
                        .param("year", "2026")
                        .param("month", "7"))
                .andExpect(status().isBadRequest());
    }
}
