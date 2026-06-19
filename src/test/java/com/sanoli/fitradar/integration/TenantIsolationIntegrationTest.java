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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Garante que criadores e alunos nunca leem/escrevem dados de outro tenant.
 */
class TenantIsolationIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    MockMvc mockMvc;

    @Autowired
    IntegrationTestSupport support;

    private IntegrationTestSupport.AuthContext creatorA;
    private IntegrationTestSupport.AuthContext creatorB;
    private IntegrationTestSupport.ProgramContext programA;
    private IntegrationTestSupport.StudentContext studentA;
    private String studentAToken;

    @BeforeEach
    void setUpTenants() throws Exception {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        creatorA = support.registerCreator("tenant-a-" + suffix + "@test.local");
        creatorB = support.registerCreator("tenant-b-" + suffix + "@test.local");
        support.createSpace(creatorA.token(), "tenant-a-" + suffix);
        support.createSpace(creatorB.token(), "tenant-b-" + suffix);
        programA = support.createProgramWithWorkout(creatorA.token(), "Programa A");
        studentA = support.inviteStudent(creatorA.token(), "Aluno A", "tenant-a-student-" + suffix + "@test.local");
        support.enrollStudent(creatorA.token(), studentA.studentId(), programA.programId());
        studentAToken = support.login(studentA.email(), studentA.temporaryPassword());
    }

    // ------------------------- leitura: criador vs criador -------------------------

    @Test
    void creatorBCannotReadCreatorAStudent() throws Exception {
        mockMvc.perform(get("/api/v1/students/" + studentA.studentId())
                        .header("Authorization", "Bearer " + creatorB.token()))
                .andExpect(status().isNotFound());
    }

    @Test
    void creatorBCannotListCreatorAStudentEnrollments() throws Exception {
        mockMvc.perform(get("/api/v1/students/" + studentA.studentId() + "/enrollments")
                        .header("Authorization", "Bearer " + creatorB.token()))
                .andExpect(status().isNotFound());
    }

    @Test
    void creatorBCannotReadCreatorAProgram() throws Exception {
        mockMvc.perform(get("/api/v1/programs/" + programA.programId())
                        .header("Authorization", "Bearer " + creatorB.token()))
                .andExpect(status().isNotFound());
    }

    @Test
    void creatorBCannotReadCreatorAWorkouts() throws Exception {
        mockMvc.perform(get("/api/v1/programs/" + programA.programId() + "/workouts")
                        .header("Authorization", "Bearer " + creatorB.token()))
                .andExpect(status().isNotFound());
    }

    @Test
    void creatorBCannotReadCreatorAStudentRisk() throws Exception {
        mockMvc.perform(get("/api/v1/retention/students/" + studentA.studentId() + "/risk")
                        .header("Authorization", "Bearer " + creatorB.token()))
                .andExpect(status().isNotFound());
    }

    @Test
    void creatorAListStudentsDoesNotIncludeCreatorBStudents() throws Exception {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        support.inviteStudent(creatorB.token(), "Aluno B", "tenant-b-student-" + suffix + "@test.local");

        MvcResult result = mockMvc.perform(get("/api/v1/students")
                        .header("Authorization", "Bearer " + creatorA.token()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode page = support.objectMapper.readTree(result.getResponse().getContentAsString());
        JsonNode list = page.get("content");
        assertThat(list).hasSize(1);
        assertThat(list.get(0).get("email").asText()).isEqualTo(studentA.email());
    }

    // ------------------------- escrita: criador vs criador -------------------------

    @Test
    void creatorBCannotEnrollCreatorAStudent() throws Exception {
        IntegrationTestSupport.ProgramContext programB =
                support.createProgramWithWorkout(creatorB.token(), "Programa B");

        mockMvc.perform(post("/api/v1/students/" + studentA.studentId() + "/enrollments")
                        .header("Authorization", "Bearer " + creatorB.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"programId":"%s"}
                                """.formatted(programB.programId())))
                .andExpect(status().isNotFound());
    }

    @Test
    void creatorBCannotUpdateCreatorAProgram() throws Exception {
        mockMvc.perform(put("/api/v1/programs/" + programA.programId())
                        .header("Authorization", "Bearer " + creatorB.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":"Hack","description":"","active":true,"price":0}
                                """))
                .andExpect(status().isNotFound());
    }

    @Test
    void creatorBCannotDeleteCreatorAWorkout() throws Exception {
        mockMvc.perform(delete("/api/v1/programs/" + programA.programId() + "/workouts/" + programA.workoutId())
                        .header("Authorization", "Bearer " + creatorB.token()))
                .andExpect(status().isNotFound());
    }

    // ------------------------- aluno: escopo do próprio criador -------------------------

    @Test
    void studentCannotAccessCreatorRetentionEndpoints() throws Exception {
        mockMvc.perform(get("/api/v1/retention/overview")
                        .header("Authorization", "Bearer " + studentAToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/v1/students")
                        .header("Authorization", "Bearer " + studentAToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void studentCanAccessOwnProgressAndCheckIns() throws Exception {
        mockMvc.perform(post("/api/v1/my/check-ins")
                        .header("Authorization", "Bearer " + studentAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"workoutId":"%s","skipped":false}
                                """.formatted(programA.workoutId())))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/v1/my/progress")
                        .header("Authorization", "Bearer " + studentAToken))
                .andExpect(status().isOk());

        MvcResult checkIns = mockMvc.perform(get("/api/v1/my/check-ins")
                        .header("Authorization", "Bearer " + studentAToken))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode page = support.objectMapper.readTree(checkIns.getResponse().getContentAsString());
        assertThat(page.get("content")).hasSize(1);
    }

    @Test
    void studentCannotCheckInOnAnotherCreatorsWorkout() throws Exception {
        IntegrationTestSupport.ProgramContext programB =
                support.createProgramWithWorkout(creatorB.token(), "Programa B isolado");

        mockMvc.perform(post("/api/v1/my/check-ins")
                        .header("Authorization", "Bearer " + studentAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"workoutId":"%s","skipped":false}
                                """.formatted(programB.workoutId())))
                .andExpect(status().isForbidden());
    }

    @Test
    void studentOfCreatorBOnlySeesCreatorBWorkouts() throws Exception {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        IntegrationTestSupport.StudentContext studentB =
                support.inviteStudent(creatorB.token(), "Aluno B", "tenant-b-student2-" + suffix + "@test.local");
        IntegrationTestSupport.ProgramContext programB =
                support.createProgramWithWorkout(creatorB.token(), "Programa B aluno");
        support.enrollStudent(creatorB.token(), studentB.studentId(), programB.programId());
        String studentBToken = support.login(studentB.email(), studentB.temporaryPassword());

        MvcResult workoutsA = mockMvc.perform(get("/api/v1/my/workouts")
                        .header("Authorization", "Bearer " + studentAToken))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode listA = support.objectMapper.readTree(workoutsA.getResponse().getContentAsString());
        assertThat(listA).extracting(node -> node.get("id").asText()).containsExactly(programA.workoutId());

        MvcResult workoutsB = mockMvc.perform(get("/api/v1/my/workouts")
                        .header("Authorization", "Bearer " + studentBToken))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode listB = support.objectMapper.readTree(workoutsB.getResponse().getContentAsString());
        assertThat(listB).extracting(node -> node.get("id").asText()).containsExactly(programB.workoutId());
        assertThat(listB).extracting(node -> node.get("id").asText()).doesNotContain(programA.workoutId());
    }
}
