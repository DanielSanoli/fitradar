package com.sanoli.fitradar.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.sanoli.fitradar.billing.AsaasClient;
import com.sanoli.fitradar.config.BillingProperties;
import com.sanoli.fitradar.domain.AppUser;
import com.sanoli.fitradar.domain.SubscriptionPlan;
import com.sanoli.fitradar.domain.SubscriptionStatus;
import com.sanoli.fitradar.exception.WebhookUnauthorizedException;
import com.sanoli.fitradar.repository.UserRepository;
import com.sanoli.fitradar.security.CurrentUserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class BillingServiceTest {

    private static final String WEBHOOK_TOKEN = "secret-webhook-token";
    private static final String SUBSCRIPTION_ID = "sub_123";

    private UserRepository userRepository;
    private BillingProperties billingProperties;
    private BillingService billingService;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        billingProperties = new BillingProperties();
        billingProperties.getAsaas().setEnabled(true);
        billingProperties.getAsaas().setApiKey("asaas-test-key");
        billingProperties.getAsaas().setWebhookToken(WEBHOOK_TOKEN);

        billingService = new BillingService(
                mock(CurrentUserService.class),
                userRepository,
                mock(AsaasClient.class),
                billingProperties,
                mock(MarketplaceBillingService.class)
        );
        objectMapper = new ObjectMapper();
    }

    @Test
    void webhook_rejectsInvalidToken() {
        ObjectNode payload = objectMapper.createObjectNode();
        payload.put("event", "PAYMENT_CONFIRMED");

        assertThatThrownBy(() -> billingService.handleWebhook("wrong-token", payload))
                .isInstanceOf(WebhookUnauthorizedException.class);
    }

    @Test
    void webhook_rejectsMissingTokenWhenBillingEnabled() {
        ObjectNode payload = objectMapper.createObjectNode();
        payload.put("event", "PAYMENT_CONFIRMED");

        assertThatThrownBy(() -> billingService.handleWebhook(null, payload))
                .isInstanceOf(WebhookUnauthorizedException.class);
    }

    @Test
    void webhook_paymentConfirmed_activatesProSubscription() {
        AppUser user = creatorWithSubscription();
        when(userRepository.findByAsaasSubscriptionId(SUBSCRIPTION_ID)).thenReturn(Optional.of(user));

        ObjectNode payload = paymentPayload("PAYMENT_CONFIRMED");

        billingService.handleWebhook(WEBHOOK_TOKEN, payload);

        assertThat(user.getPlan()).isEqualTo(SubscriptionPlan.PRO);
        assertThat(user.getSubscriptionStatus()).isEqualTo(SubscriptionStatus.ACTIVE);
        verify(userRepository).save(user);
    }

    @Test
    void webhook_subscriptionDeleted_downgradesToFree() {
        AppUser user = creatorWithSubscription();
        user.setPlan(SubscriptionPlan.PRO);
        user.setSubscriptionStatus(SubscriptionStatus.ACTIVE);
        when(userRepository.findByAsaasSubscriptionId(SUBSCRIPTION_ID)).thenReturn(Optional.of(user));

        ObjectNode payload = paymentPayload("SUBSCRIPTION_DELETED");

        billingService.handleWebhook(WEBHOOK_TOKEN, payload);

        assertThat(user.getPlan()).isEqualTo(SubscriptionPlan.FREE);
        assertThat(user.getSubscriptionStatus()).isEqualTo(SubscriptionStatus.CANCELED);
        verify(userRepository).save(user);
    }

    @Test
    void webhook_skipsWhenAsaasDisabled() {
        billingProperties.getAsaas().setEnabled(false);
        billingProperties.getAsaas().setApiKey("");
        ObjectNode payload = paymentPayload("PAYMENT_CONFIRMED");

        billingService.handleWebhook(null, payload);

        verify(userRepository, never()).save(any());
    }

    private AppUser creatorWithSubscription() {
        AppUser user = new AppUser();
        user.setId(UUID.randomUUID());
        user.setAsaasSubscriptionId(SUBSCRIPTION_ID);
        user.setPlan(SubscriptionPlan.FREE);
        user.setSubscriptionStatus(SubscriptionStatus.CANCELED);
        return user;
    }

    private ObjectNode paymentPayload(String event) {
        ObjectNode payload = objectMapper.createObjectNode();
        payload.put("event", event);
        ObjectNode payment = objectMapper.createObjectNode();
        payment.put("subscription", SUBSCRIPTION_ID);
        payload.set("payment", payment);
        return payload;
    }
}
