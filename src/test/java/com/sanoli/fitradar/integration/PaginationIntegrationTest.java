package com.sanoli.fitradar.integration;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class PaginationIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    MockMvc mockMvc;

    @Autowired
    IntegrationTestSupport support;

    @Test
    void studentListCapsRequestedPageSize() throws Exception {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        IntegrationTestSupport.AuthContext creator =
                support.registerCreator("pagination-" + suffix + "@test.local");

        mockMvc.perform(get("/api/v1/students")
                        .param("size", "500")
                        .header("Authorization", "Bearer " + creator.token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.size").value(100))
                .andExpect(jsonPath("$.content").isArray());
    }
}
