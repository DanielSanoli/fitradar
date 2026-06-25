package com.sanoli.fitradar.integration;

import com.sanoli.fitradar.domain.AppUser;
import com.sanoli.fitradar.domain.SubscriptionPlan;
import com.sanoli.fitradar.domain.SubscriptionStatus;
import com.sanoli.fitradar.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ProFeatureAccessIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    MockMvc mockMvc;

    @Autowired
    IntegrationTestSupport support;

    @Autowired
    UserRepository userRepository;

    @Test
    void retentionOverviewBlockedForFreeCreatorAfterTrial() throws Exception {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        IntegrationTestSupport.AuthContext creator =
                support.registerCreator("free-post-trial-" + suffix + "@test.local");

        AppUser user = userRepository.findById(UUID.fromString(creator.userId())).orElseThrow();
        user.setPlan(SubscriptionPlan.FREE);
        user.setSubscriptionStatus(SubscriptionStatus.CANCELED);
        user.setTrialEndsAt(LocalDateTime.now().minusDays(1));
        userRepository.save(user);

        mockMvc.perform(get("/api/v1/retention/overview")
                        .header("Authorization", "Bearer " + creator.token()))
                .andExpect(status().isPaymentRequired())
                .andExpect(jsonPath("$.error").value("SUBSCRIPTION_REQUIRED"))
                .andExpect(jsonPath("$.message").value("Recurso disponível no plano Pro"));
    }

    @Test
    void retentionOverviewAllowedForTrialingCreator() throws Exception {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        IntegrationTestSupport.AuthContext creator =
                support.registerCreator("trialing-" + suffix + "@test.local");

        mockMvc.perform(get("/api/v1/retention/overview")
                        .header("Authorization", "Bearer " + creator.token()))
                .andExpect(status().isOk());
    }

    @Test
    void retentionOverviewAllowedForActiveProCreator() throws Exception {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        IntegrationTestSupport.AuthContext creator =
                support.registerCreator("pro-active-" + suffix + "@test.local");

        AppUser user = userRepository.findById(UUID.fromString(creator.userId())).orElseThrow();
        user.setPlan(SubscriptionPlan.PRO);
        user.setSubscriptionStatus(SubscriptionStatus.ACTIVE);
        userRepository.save(user);

        mockMvc.perform(get("/api/v1/retention/overview")
                        .header("Authorization", "Bearer " + creator.token()))
                .andExpect(status().isOk());
    }
}
