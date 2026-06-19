package com.sanoli.fitradar.integration;

import com.sanoli.fitradar.observability.RequestCorrelationFilter;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class RequestCorrelationIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    MockMvc mockMvc;

    @Test
    void responseIncludesRequestIdHeader() throws Exception {
        mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk())
                .andExpect(header().exists(RequestCorrelationFilter.REQUEST_ID_HEADER))
                .andExpect(result -> {
                    String requestId = result.getResponse().getHeader(RequestCorrelationFilter.REQUEST_ID_HEADER);
                    assertThat(requestId).isNotBlank();
                });
    }
}
