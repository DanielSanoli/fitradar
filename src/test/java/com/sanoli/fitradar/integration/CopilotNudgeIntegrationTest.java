package com.sanoli.fitradar.integration;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class CopilotNudgeIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    MockMvc mockMvc;

    @Autowired
    IntegrationTestSupport support;

    @Test
    void sendNudge_deliversEmailInDevMode() throws Exception {
        String creatorEmail = "nudge-creator-" + System.nanoTime() + "@test.com";
        IntegrationTestSupport.AuthContext creator = support.registerCreator(creatorEmail);
        support.createSpace(creator.token(), "nudge-space");

        IntegrationTestSupport.StudentContext student = support.inviteStudent(
                creator.token(),
                "Aluno Nudge",
                "nudge-student-" + System.nanoTime() + "@test.com"
        );

        mockMvc.perform(post("/api/v1/copilot/nudge/" + student.studentId() + "/send")
                        .header("Authorization", "Bearer " + creator.token())
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content("""
                                {"message":"Oi! Sentimos sua falta nos treinos."}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.emailSent").value(true))
                .andExpect(jsonPath("$.studentId").value(student.studentId()))
                .andExpect(jsonPath("$.summary").isNotEmpty())
                .andExpect(jsonPath("$.deliveryId").isNotEmpty());
    }

    @Test
    void sendNudge_rejectsEmptyMessage() throws Exception {
        String creatorEmail = "nudge-empty-" + System.nanoTime() + "@test.com";
        IntegrationTestSupport.AuthContext creator = support.registerCreator(creatorEmail);
        IntegrationTestSupport.StudentContext student = support.inviteStudent(
                creator.token(),
                "Aluno",
                "nudge-empty-student-" + System.nanoTime() + "@test.com"
        );

        mockMvc.perform(post("/api/v1/copilot/nudge/" + student.studentId() + "/send")
                        .header("Authorization", "Bearer " + creator.token())
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content("""
                                {"message":"   "}
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void sendNudge_blocksCrossTenantStudent() throws Exception {
        IntegrationTestSupport.AuthContext creatorA = support.registerCreator(
                "nudge-a-" + System.nanoTime() + "@test.com");
        IntegrationTestSupport.AuthContext creatorB = support.registerCreator(
                "nudge-b-" + System.nanoTime() + "@test.com");
        IntegrationTestSupport.StudentContext studentB = support.inviteStudent(
                creatorB.token(),
                "Aluno B",
                "nudge-b-student-" + System.nanoTime() + "@test.com"
        );

        mockMvc.perform(post("/api/v1/copilot/nudge/" + studentB.studentId() + "/send")
                        .header("Authorization", "Bearer " + creatorA.token())
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content("""
                                {"message":"Tentativa cross-tenant"}
                                """))
                .andExpect(status().isNotFound());
    }
}
