package com.sanoli.fitradar.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class CreatorSpaceLogoIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    MockMvc mockMvc;

    @Autowired
    ObjectMapper objectMapper;

    @Autowired
    IntegrationTestSupport support;

    @Test
    void uploadLogo_persistsAndServesPublicly() throws Exception {
        var creator = support.registerCreator("logo-" + System.nanoTime() + "@test.com");
        support.createSpace(creator.token(), "logo-space");

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "logo.png",
                "image/png",
                new byte[]{(byte) 137, 80, 78, 71, 13, 10, 26, 10});

        var uploadResult = mockMvc.perform(multipart("/api/v1/creator-space/logo")
                        .file(file)
                        .header("Authorization", "Bearer " + creator.token()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode uploadBody = objectMapper.readTree(uploadResult.getResponse().getContentAsString());
        String logoUrl = uploadBody.get("logoUrl").asText();
        assertThat(logoUrl).startsWith("/uploads/logos/");

        var spaceResult = mockMvc.perform(get("/api/v1/creator-space")
                        .header("Authorization", "Bearer " + creator.token()))
                .andExpect(status().isOk())
                .andReturn();
        assertThat(objectMapper.readTree(spaceResult.getResponse().getContentAsString()).get("logoUrl").asText())
                .isEqualTo(logoUrl);

        mockMvc.perform(get(logoUrl)).andExpect(status().isOk());

        var publicResult = mockMvc.perform(get("/api/v1/public/spaces/logo-space"))
                .andExpect(status().isOk())
                .andReturn();
        assertThat(objectMapper.readTree(publicResult.getResponse().getContentAsString()).get("logoUrl").asText())
                .isEqualTo(logoUrl);
    }

    @Test
    void saveSpace_rejectsDataUrlLogo() throws Exception {
        var creator = support.registerCreator("data-url-" + System.nanoTime() + "@test.com");

        mockMvc.perform(put("/api/v1/creator-space")
                        .header("Authorization", "Bearer " + creator.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Studio","slug":"studio-data","logoUrl":"data:image/png;base64,abc"}
                                """))
                .andExpect(status().isOk());

        var spaceResult = mockMvc.perform(get("/api/v1/creator-space")
                        .header("Authorization", "Bearer " + creator.token()))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode spaceJson = objectMapper.readTree(spaceResult.getResponse().getContentAsString());
        JsonNode logoUrlNode = spaceJson.get("logoUrl");
        assertThat(logoUrlNode == null || logoUrlNode.isNull()).isTrue();
    }
}
