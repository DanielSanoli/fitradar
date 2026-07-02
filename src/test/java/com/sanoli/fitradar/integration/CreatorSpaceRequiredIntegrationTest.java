package com.sanoli.fitradar.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class CreatorSpaceRequiredIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    MockMvc mockMvc;

    @Autowired
    ObjectMapper objectMapper;

    @Autowired
    IntegrationTestSupport support;

    @Test
    void creatorWithoutSpaceCannotCreateProgramOrWorkout() throws Exception {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        IntegrationTestSupport.AuthContext creator =
                support.registerCreator("no-space-" + suffix + "@test.local");

        mockMvc.perform(post("/api/v1/programs")
                        .header("Authorization", "Bearer " + creator.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":"Sem espaco","description":"Teste","active":true,"price":0}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message")
                        .value("Crie seu espaço antes de montar programas e treinos."));
    }

    @Test
    void creatorWithSpaceCanCreateProgram() throws Exception {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        IntegrationTestSupport.AuthContext creator =
                support.registerCreator("with-space-" + suffix + "@test.local");
        support.createSpace(creator.token(), "space-" + suffix);

        mockMvc.perform(post("/api/v1/programs")
                        .header("Authorization", "Bearer " + creator.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":"Com espaco","description":"Teste","active":true,"price":0}
                                """))
                .andExpect(status().isCreated());
    }
}
