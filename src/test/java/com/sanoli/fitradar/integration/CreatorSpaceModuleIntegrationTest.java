package com.sanoli.fitradar.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class CreatorSpaceModuleIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    MockMvc mockMvc;

    @Autowired
    ObjectMapper objectMapper;

    @Autowired
    IntegrationTestSupport support;

    @Test
    void nutritionOnlySpaceCannotCreateWorkoutWhenHybridWouldRequireTraining() throws Exception {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        IntegrationTestSupport.AuthContext creator =
                support.registerCreator("nutrition-only-" + suffix + "@test.local");
        support.createSpace(creator.token(), "nutri-" + suffix, java.util.List.of("NUTRITION"));

        MvcResult programResult = mockMvc.perform(post("/api/v1/programs")
                        .header("Authorization", "Bearer " + creator.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":"Plano","description":"Teste","active":true,"price":0}
                                """))
                .andExpect(status().isCreated())
                .andReturn();
        String programId = objectMapper.readTree(programResult.getResponse().getContentAsString()).get("id").asText();

        mockMvc.perform(post("/api/v1/programs/" + programId + "/workouts")
                        .header("Authorization", "Bearer " + creator.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":"Refeicao","description":"","contentMarkdown":"## Cafe","dayIndex":0}
                                """))
                .andExpect(status().isCreated());
    }

    @Test
    void trainingOnlySpaceCannotCreateStructuredMeal() throws Exception {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        IntegrationTestSupport.AuthContext creator =
                support.registerCreator("training-only-" + suffix + "@test.local");
        support.createSpace(creator.token(), "train-" + suffix, java.util.List.of("TRAINING"));

        MvcResult programResult = mockMvc.perform(post("/api/v1/programs")
                        .header("Authorization", "Bearer " + creator.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":"Programa","description":"Teste","active":true,"price":0}
                                """))
                .andExpect(status().isCreated())
                .andReturn();
        String programId = objectMapper.readTree(programResult.getResponse().getContentAsString()).get("id").asText();

        mockMvc.perform(post("/api/v1/programs/" + programId + "/meals")
                        .header("Authorization", "Bearer " + creator.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"nome":"Cafe","ordem":1}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Ative o módulo Nutrição no seu espaço."));
    }

    @Test
    void hybridSpaceAcceptsBothModulesOnSave() throws Exception {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        IntegrationTestSupport.AuthContext creator =
                support.registerCreator("hybrid-" + suffix + "@test.local");

        mockMvc.perform(put("/api/v1/creator-space")
                        .header("Authorization", "Bearer " + creator.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Hibrido","slug":"hybrid-%s","bio":"Teste","category":"GYM","modules":["TRAINING","NUTRITION"]}
                                """.formatted(suffix)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.modules.length()").value(2));
    }
}
