package com.sanoli.fitradar.integration;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@TestPropertySource(properties = {
        "app.observability.metrics-enabled=true",
        "app.observability.management-token=metrics-test-token",
        "management.endpoints.web.exposure.include=health,prometheus",
        "management.prometheus.metrics.export.enabled=true"
})
class PrometheusActuatorIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    MockMvc mockMvc;

    @Test
    void prometheusRequiresManagementToken() throws Exception {
        mockMvc.perform(get("/actuator/prometheus"))
                .andExpect(status().isForbidden());
    }

    @Test
    void prometheusAcceptsValidManagementToken() throws Exception {
        mockMvc.perform(get("/actuator/prometheus")
                        .header("X-Management-Token", "metrics-test-token"))
                .andExpect(status().isOk());
    }
}
