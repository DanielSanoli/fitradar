package com.sanoli.fitradar.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sanoli.fitradar.repository.FoodRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.context.jdbc.Sql;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class NutritionIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private FoodRepository foodRepository;

    @Autowired
    private IntegrationTestSupport support;

    private IntegrationTestSupport.AuthContext creator;
    private String studentToken;
    private String programId;

    @BeforeEach
    void setUp() throws Exception {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        creator = support.registerCreator("nutrition-" + suffix + "@test.local");
        support.createSpace(creator.token(), "nutrition-" + suffix);

        MvcResult programResult = mockMvc.perform(post("/api/v1/programs")
                        .header("Authorization", "Bearer " + creator.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":"Plano TACO","description":"Teste","active":true,"price":0}
                                """))
                .andExpect(status().isCreated())
                .andReturn();
        programId = objectMapper.readTree(programResult.getResponse().getContentAsString()).get("id").asText();

        IntegrationTestSupport.StudentContext student = support.inviteStudent(
                creator.token(), "Aluno Nutri", "nutrition-student-" + suffix + "@test.local");
        support.enrollStudent(creator.token(), student.studentId(), programId);
        studentToken = support.login(student.email(), student.temporaryPassword());
        submitAnamnese(studentToken);
    }

    @Test
    @Sql(scripts = "/test-data/taco-foods.sql")
    void creatorBuildsStructuredPlanWithDeterministicTotals() throws Exception {
        assertThat(foodRepository.count()).isGreaterThan(0);

        MvcResult searchResult = mockMvc.perform(
                        get("/api/v1/foods?q=arroz").header("Authorization", "Bearer " + creator.token()))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode foods = objectMapper.readTree(searchResult.getResponse().getContentAsString());
        assertThat(foods.isArray()).isTrue();
        assertThat(foods.size()).isPositive();
        String foodId = foods.get(0).get("id").asText();

        MvcResult mealResult = mockMvc.perform(post("/api/v1/programs/" + programId + "/meals")
                        .header("Authorization", "Bearer " + creator.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"nome":"Café da manhã","horario":"08:00:00","ordem":1}
                                """))
                .andExpect(status().isCreated())
                .andReturn();
        String mealId = objectMapper.readTree(mealResult.getResponse().getContentAsString()).get("id").asText();

        mockMvc.perform(post("/api/v1/programs/" + programId + "/meals/" + mealId + "/items")
                        .header("Authorization", "Bearer " + creator.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"foodId":"%s","quantidadeG":150.00,"ordem":1}
                                """.formatted(foodId)))
                .andExpect(status().isCreated());

        MvcResult planResult = mockMvc.perform(get("/api/v1/programs/" + programId + "/nutrition")
                        .header("Authorization", "Bearer " + creator.token()))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode plan = objectMapper.readTree(planResult.getResponse().getContentAsString());
        assertThat(plan.get("structured").asBoolean()).isTrue();
        assertThat(plan.get("dailyTotals").get("kcal").asText()).isNotBlank();
        assertThat(plan.get("weeklyProjectionLabel").asText()).contains("7×");

        MvcResult studentPlan = mockMvc.perform(get("/api/v1/my/programs/" + programId + "/nutrition")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode studentJson = objectMapper.readTree(studentPlan.getResponse().getContentAsString());
        assertThat(studentJson.get("dailyTotals").get("kcal").asText())
                .isEqualTo(plan.get("dailyTotals").get("kcal").asText());
    }

    @Test
    void customFoodIsScopedToCreator() throws Exception {
        String otherSuffix = UUID.randomUUID().toString().substring(0, 8);
        IntegrationTestSupport.AuthContext other = support.registerCreator(
                "other-nutrition-" + otherSuffix + "@test.local");
        support.createSpace(other.token(), "other-nutrition-" + otherSuffix);

        MvcResult created = mockMvc.perform(post("/api/v1/foods")
                        .header("Authorization", "Bearer " + other.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"nome":"Blend do coach","kcalPor100g":350,"proteinaPor100g":30,"carboPor100g":20,"gorduraPor100g":10}
                                """))
                .andExpect(status().isCreated())
                .andReturn();
        String customId = objectMapper.readTree(created.getResponse().getContentAsString()).get("id").asText();

        MvcResult mealResult = mockMvc.perform(post("/api/v1/programs/" + programId + "/meals")
                        .header("Authorization", "Bearer " + creator.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"nome":"Lanche","ordem":1}
                                """))
                .andExpect(status().isCreated())
                .andReturn();
        String mealId = objectMapper.readTree(mealResult.getResponse().getContentAsString()).get("id").asText();

        mockMvc.perform(post("/api/v1/programs/" + programId + "/meals/" + mealId + "/items")
                        .header("Authorization", "Bearer " + creator.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"foodId":"%s","quantidadeG":100.00}
                                """.formatted(customId)))
                .andExpect(status().isNotFound());
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
