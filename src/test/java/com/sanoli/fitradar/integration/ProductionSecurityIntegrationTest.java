package com.sanoli.fitradar.integration;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@TestPropertySource(properties = {
        "springdoc.api-docs.enabled=false",
        "springdoc.swagger-ui.enabled=false"
})
class ProductionSecurityIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    MockMvc mockMvc;

    @DynamicPropertySource
    static void productionSecurity(DynamicPropertyRegistry registry) {
        registry.add("app.runtime.production", () -> "true");
        registry.add("app.security.jwt.secret",
                () -> "ci-production-test-secret-with-sufficient-length-32chars");
    }

    @Test
    void swaggerUiNotPublicInProduction() throws Exception {
        int status = mockMvc.perform(get("/swagger-ui.html"))
                .andReturn()
                .getResponse()
                .getStatus();
        org.assertj.core.api.Assertions.assertThat(status).isNotEqualTo(200);
    }

    @Test
    void openApiDocsNotPublicInProduction() throws Exception {
        int status = mockMvc.perform(get("/v3/api-docs"))
                .andReturn()
                .getResponse()
                .getStatus();
        org.assertj.core.api.Assertions.assertThat(status).isNotEqualTo(200);
    }

    @Test
    void prometheusEndpointHiddenWhenMetricsDisabled() throws Exception {
        mockMvc.perform(get("/actuator/prometheus"))
                .andExpect(status().isNotFound());
    }
}
