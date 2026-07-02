package com.sanoli.fitradar.integration;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ProgressPhotoIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    MockMvc mockMvc;

    @Autowired
    IntegrationTestSupport support;

    private IntegrationTestSupport.AuthContext creatorA;
    private IntegrationTestSupport.AuthContext creatorB;
    private IntegrationTestSupport.StudentContext studentA;
    private IntegrationTestSupport.StudentContext studentB;
    private String studentAToken;
    private String studentBToken;

    @BeforeEach
    void setUp() throws Exception {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        creatorA = support.registerCreator("photo-a-" + suffix + "@test.local");
        creatorB = support.registerCreator("photo-b-" + suffix + "@test.local");
        support.createSpace(creatorA.token(), "photo-a-" + suffix);
        studentA = support.inviteStudent(creatorA.token(), "Aluno Photo A", "photo-a-student-" + suffix + "@test.local");
        studentB = support.inviteStudent(creatorB.token(), "Aluno Photo B", "photo-b-student-" + suffix + "@test.local");
        studentAToken = support.login(studentA.email(), studentA.temporaryPassword());
        studentBToken = support.login(studentB.email(), studentB.temporaryPassword());
        submitAnamnese(studentAToken);
        submitAnamnese(studentBToken);
    }

    @Test
    void uploadRequiresConsent() throws Exception {
        MockMultipartFile file = pngFile();

        mockMvc.perform(multipart("/api/v1/my/progress-photos")
                        .file(file)
                        .param("date", "2026-06-01")
                        .header("Authorization", "Bearer " + studentAToken))
                .andExpect(status().isBadRequest());
    }

    @Test
    void studentUploadListDeleteAndServeContent() throws Exception {
        grantConsent(studentAToken);

        MockMultipartFile file = pngFile();
        MvcResult upload = mockMvc.perform(multipart("/api/v1/my/progress-photos")
                        .file(file)
                        .param("date", "2026-06-10")
                        .param("weight", "78.50")
                        .param("note", "Semana 1")
                        .header("Authorization", "Bearer " + studentAToken))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.sharedWithCoach").value(false))
                .andReturn();

        String photoId = support.objectMapper.readTree(upload.getResponse().getContentAsString()).get("id").asText();

        mockMvc.perform(get("/api/v1/my/progress-photos")
                        .header("Authorization", "Bearer " + studentAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].note").value("Semana 1"));

        mockMvc.perform(get("/api/v1/my/progress-photos/" + photoId + "/content")
                        .header("Authorization", "Bearer " + studentAToken))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/my/progress-photos/" + photoId + "/content"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(delete("/api/v1/my/progress-photos/" + photoId)
                        .header("Authorization", "Bearer " + studentAToken))
                .andExpect(status().isNoContent());
    }

    @Test
    void coachOnlySeesSharedPhotos() throws Exception {
        grantConsent(studentAToken);

        MvcResult upload = mockMvc.perform(multipart("/api/v1/my/progress-photos")
                        .file(pngFile())
                        .param("date", "2026-06-12")
                        .header("Authorization", "Bearer " + studentAToken))
                .andExpect(status().isCreated())
                .andReturn();
        String photoId = support.objectMapper.readTree(upload.getResponse().getContentAsString()).get("id").asText();

        mockMvc.perform(get("/api/v1/students/" + studentA.studentId() + "/progress-photos")
                        .header("Authorization", "Bearer " + creatorA.token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());

        mockMvc.perform(get("/api/v1/students/" + studentA.studentId() + "/progress-photos/" + photoId + "/content")
                        .header("Authorization", "Bearer " + creatorA.token()))
                .andExpect(status().isForbidden());

        mockMvc.perform(patch("/api/v1/my/progress-photos/" + photoId + "/sharing")
                        .header("Authorization", "Bearer " + studentAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"sharedWithCoach":true}
                                """))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/students/" + studentA.studentId() + "/progress-photos")
                        .header("Authorization", "Bearer " + creatorA.token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(photoId));

        mockMvc.perform(get("/api/v1/students/" + studentA.studentId() + "/progress-photos/" + photoId + "/content")
                        .header("Authorization", "Bearer " + creatorB.token()))
                .andExpect(status().isNotFound());
    }

    @Test
    void studentBCannotAccessStudentAPhotoContent() throws Exception {
        grantConsent(studentAToken);
        MvcResult upload = mockMvc.perform(multipart("/api/v1/my/progress-photos")
                        .file(pngFile())
                        .param("date", "2026-06-15")
                        .header("Authorization", "Bearer " + studentAToken))
                .andExpect(status().isCreated())
                .andReturn();
        String photoId = support.objectMapper.readTree(upload.getResponse().getContentAsString()).get("id").asText();

        mockMvc.perform(get("/api/v1/my/progress-photos/" + photoId + "/content")
                        .header("Authorization", "Bearer " + studentBToken))
                .andExpect(status().isNotFound());
    }

    private void grantConsent(String token) throws Exception {
        mockMvc.perform(post("/api/v1/my/progress-photos/consent")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"consentProgressPhotos":true}
                                """))
                .andExpect(status().isCreated());
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

    private MockMultipartFile pngFile() {
        return new MockMultipartFile(
                "file",
                "progress.png",
                "image/png",
                new byte[]{(byte) 137, 80, 78, 71, 13, 10, 26, 10});
    }
}
