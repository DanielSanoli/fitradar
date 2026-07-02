package com.sanoli.fitradar.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.sanoli.fitradar.billing.AsaasClient;
import com.sanoli.fitradar.config.BillingProperties;
import com.sanoli.fitradar.domain.AppUser;
import com.sanoli.fitradar.domain.SubscriptionPlan;
import com.sanoli.fitradar.domain.SubscriptionStatus;
import com.sanoli.fitradar.domain.WebhookEvent;
import com.sanoli.fitradar.domain.WebhookEventStatus;
import com.sanoli.fitradar.dto.ProCheckoutRequest;
import com.sanoli.fitradar.exception.BusinessException;
import com.sanoli.fitradar.exception.WebhookUnauthorizedException;
import com.sanoli.fitradar.repository.UserRepository;
import com.sanoli.fitradar.security.CurrentUserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class BillingServiceTest {

    private static final String WEBHOOK_TOKEN = "secret-webhook-token";
    private static final String SUBSCRIPTION_ID = "sub_123";

    private UserRepository userRepository;
    private BillingProperties billingProperties;
    private PlanEntitlementService planEntitlementService;
    private BillingService billingService;
    private ObjectMapper objectMapper;
    private CurrentUserService currentUserService;
    private AsaasClient asaasClient;
    private WebhookEventService webhookEventService;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        currentUserService = mock(CurrentUserService.class);
        asaasClient = mock(AsaasClient.class);
        webhookEventService = mock(WebhookEventService.class);
        billingProperties = new BillingProperties();
        billingProperties.getAsaas().setEnabled(true);
        billingProperties.getAsaas().setApiKey("asaas-test-key");
        billingProperties.getAsaas().setWebhookToken(WEBHOOK_TOKEN);
        billingProperties.getMarketplace().setPlatformFeePercentFree(new BigDecimal("10.00"));
        billingProperties.getMarketplace().setPlatformFeePercentPro(BigDecimal.ZERO);
        billingProperties.getLimits().setFreeMaxStudents(30);
        billingProperties.getLimits().setFreeMaxActivePrograms(3);

        planEntitlementService = new PlanEntitlementService(
                billingProperties,
                userRepository,
                mock(com.sanoli.fitradar.repository.ProgramRepository.class)
        );

        billingService = new BillingService(
                currentUserService,
                userRepository,
                asaasClient,
                billingProperties,
                mock(MarketplaceBillingService.class),
                planEntitlementService,
                webhookEventService
        );
        objectMapper = new ObjectMapper();

        when(webhookEventService.hashPayload(any())).thenReturn("payload-hash");
        when(webhookEventService.beginProcessing(anyString(), anyString(), anyString())).thenAnswer(invocation -> {
            WebhookEvent event = new WebhookEvent();
            event.setEventId(invocation.getArgument(0));
            return Optional.of(event);
        });
    }

    @Test
    void createProCheckout_requiresCpfCnpjWhenMissing() {
        AppUser user = creatorWithSubscription();
        user.setAsaasSubscriptionId(null);
        when(currentUserService.requireCreator()).thenReturn(user);

        assertThatThrownBy(() -> billingService.createProCheckout(null))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("CPF ou CNPJ");
    }

    @Test
    void createProCheckout_rejectsInvalidCpfCnpj() {
        AppUser user = creatorWithSubscription();
        user.setAsaasSubscriptionId(null);
        when(currentUserService.requireCreator()).thenReturn(user);

        assertThatThrownBy(() -> billingService.createProCheckout(new ProCheckoutRequest("11111111111")))
                .isInstanceOf(BusinessException.class)
                .hasMessage("CPF ou CNPJ inválido");
    }

    @Test
    void createProCheckout_persistsCpfAndCreatesAsaasCustomer() {
        AppUser user = creatorWithSubscription();
        user.setAsaasSubscriptionId(null);
        user.setName("Ana Costa");
        user.setEmail("ana@test.com");
        when(currentUserService.requireCreator()).thenReturn(user);
        when(asaasClient.createCustomer(eq("Ana Costa"), eq("ana@test.com"), eq("52998224725")))
                .thenReturn("cus_1");
        when(asaasClient.createSubscription(eq("cus_1"), any()))
                .thenReturn(new AsaasClient.AsaasSubscriptionResult("sub_new", "https://pay.example"));

        var result = billingService.createProCheckout(new ProCheckoutRequest("529.982.247-25"));

        assertThat(user.getCpfCnpj()).isEqualTo("52998224725");
        assertThat(user.getAsaasCustomerId()).isEqualTo("cus_1");
        assertThat(result.checkoutUrl()).isEqualTo("https://pay.example");
        verify(userRepository).save(user);
    }

    @Test
    void createProCheckout_reusesSavedCpfOnReactivate() {
        AppUser user = creatorWithSubscription();
        user.setAsaasSubscriptionId(null);
        user.setCpfCnpj("52998224725");
        user.setAsaasCustomerId("cus_existing");
        when(currentUserService.requireCreator()).thenReturn(user);
        when(asaasClient.createSubscription(eq("cus_existing"), any()))
                .thenReturn(new AsaasClient.AsaasSubscriptionResult("sub_new", "https://pay.example"));

        billingService.reactivateSubscription();

        verify(asaasClient, never()).createCustomer(any(), any(), any());
        assertThat(user.getCpfCnpj()).isEqualTo("52998224725");
    }

    @Test
    void subscriptionDetails_reportsHasCpfCnpj() {
        AppUser user = creatorWithSubscription();
        user.setCpfCnpj("52998224725");
        when(currentUserService.requireCreator()).thenReturn(user);

        var details = billingService.subscriptionDetails();

        assertThat(details.hasCpfCnpj()).isTrue();
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
        verify(webhookEventService).complete("evt_PAYMENT_CONFIRMED", WebhookEventStatus.PROCESSED);
    }

    @Test
    void webhook_duplicateEventId_skipsReprocessing() {
        when(webhookEventService.beginProcessing(anyString(), anyString(), anyString())).thenReturn(Optional.empty());

        billingService.handleWebhook(WEBHOOK_TOKEN, paymentPayload("PAYMENT_CONFIRMED"));

        verify(userRepository, never()).save(any());
        verify(webhookEventService, never()).complete(anyString(), any());
        verify(webhookEventService, never()).markFailed(anyString());
    }

    @Test
    void webhook_processingFailure_marksFailedAndRethrows() {
        when(userRepository.findByAsaasSubscriptionId(SUBSCRIPTION_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> billingService.handleWebhook(WEBHOOK_TOKEN, paymentPayload("PAYMENT_CONFIRMED")))
                .isInstanceOf(BusinessException.class);

        verify(webhookEventService).markFailed("evt_PAYMENT_CONFIRMED");
        verify(webhookEventService, never()).complete(anyString(), any());
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
        assertThat(user.getAsaasSubscriptionId()).isNull();
        verify(userRepository).save(user);
    }

    @Test
    void subscriptionDetails_activePro_canCancel() {
        AppUser user = creatorWithSubscription();
        user.setPlan(SubscriptionPlan.PRO);
        user.setSubscriptionStatus(SubscriptionStatus.ACTIVE);
        when(currentUserService.requireCreator()).thenReturn(user);

        var details = billingService.subscriptionDetails();

        assertThat(details.plan()).isEqualTo(SubscriptionPlan.PRO);
        assertThat(details.canCancel()).isTrue();
        assertThat(details.canReactivate()).isFalse();
    }

    @Test
    void subscriptionDetails_trialing_canReactivate() {
        AppUser user = creatorWithSubscription();
        user.setAsaasSubscriptionId(null);
        user.setPlan(SubscriptionPlan.FREE);
        user.setSubscriptionStatus(SubscriptionStatus.TRIALING);
        when(currentUserService.requireCreator()).thenReturn(user);

        var details = billingService.subscriptionDetails();

        assertThat(details.canReactivate()).isTrue();
        assertThat(details.canCancel()).isFalse();
    }

    @Test
    void subscriptionInvoices_returnsPaymentsFromAsaas() {
        AppUser user = creatorWithSubscription();
        user.setPlan(SubscriptionPlan.PRO);
        user.setSubscriptionStatus(SubscriptionStatus.ACTIVE);
        when(currentUserService.requireCreator()).thenReturn(user);

        ObjectNode payment = objectMapper.createObjectNode();
        payment.put("id", "pay_1");
        payment.put("status", "CONFIRMED");
        payment.put("value", 97.0);
        payment.put("dueDate", "2026-06-19");
        payment.put("paymentDate", "2026-06-19");
        payment.put("invoiceUrl", "https://sandbox.asaas.com/i/pay_1");
        ArrayNode data = objectMapper.createArrayNode();
        data.add(payment);
        ObjectNode response = objectMapper.createObjectNode();
        response.set("data", data);
        when(asaasClient.listPaymentsBySubscription(SUBSCRIPTION_ID, 20)).thenReturn(response);

        var invoices = billingService.subscriptionInvoices();

        assertThat(invoices).hasSize(1);
        assertThat(invoices.getFirst().id()).isEqualTo("pay_1");
        assertThat(invoices.getFirst().value()).isEqualByComparingTo(new BigDecimal("97.0"));
    }

    @Test
    void cancelCreatorSubscription_callsAsaasAndDowngrades() {
        AppUser user = creatorWithSubscription();
        user.setPlan(SubscriptionPlan.PRO);
        user.setSubscriptionStatus(SubscriptionStatus.ACTIVE);
        when(currentUserService.requireCreator()).thenReturn(user);

        var result = billingService.cancelCreatorSubscription();

        verify(asaasClient).deleteSubscription(SUBSCRIPTION_ID);
        verify(userRepository).save(user);
        assertThat(user.getPlan()).isEqualTo(SubscriptionPlan.FREE);
        assertThat(user.getSubscriptionStatus()).isEqualTo(SubscriptionStatus.CANCELED);
        assertThat(user.getAsaasSubscriptionId()).isNull();
        assertThat(result.message()).contains("cancelada");
    }

    @Test
    void cancelCreatorSubscription_rejectsWhenNotActivePro() {
        AppUser user = creatorWithSubscription();
        user.setPlan(SubscriptionPlan.FREE);
        user.setSubscriptionStatus(SubscriptionStatus.CANCELED);
        when(currentUserService.requireCreator()).thenReturn(user);

        assertThatThrownBy(() -> billingService.cancelCreatorSubscription())
                .isInstanceOf(BusinessException.class);

        verify(asaasClient, never()).deleteSubscription(any());
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
        payload.put("id", "evt_" + event);
        payload.put("event", event);
        ObjectNode payment = objectMapper.createObjectNode();
        payment.put("subscription", SUBSCRIPTION_ID);
        payload.set("payment", payment);
        return payload;
    }
}
