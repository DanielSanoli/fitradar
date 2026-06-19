package com.sanoli.fitradar.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.sanoli.fitradar.billing.AsaasClient;
import com.sanoli.fitradar.config.BillingProperties;
import com.sanoli.fitradar.domain.AppUser;
import com.sanoli.fitradar.domain.SubscriptionPlan;
import com.sanoli.fitradar.domain.SubscriptionStatus;
import com.sanoli.fitradar.dto.CheckoutResponse;
import com.sanoli.fitradar.exception.BusinessException;
import com.sanoli.fitradar.exception.WebhookUnauthorizedException;
import com.sanoli.fitradar.observability.LoggingSanitizer;
import com.sanoli.fitradar.repository.UserRepository;
import com.sanoli.fitradar.security.CurrentUserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;

@Service
public class BillingService {

    private static final Logger log = LoggerFactory.getLogger(BillingService.class);

    private final CurrentUserService currentUserService;
    private final UserRepository userRepository;
    private final AsaasClient asaasClient;
    private final BillingProperties billingProperties;
    private final MarketplaceBillingService marketplaceBillingService;

    public BillingService(
            CurrentUserService currentUserService,
            UserRepository userRepository,
            AsaasClient asaasClient,
            BillingProperties billingProperties,
            MarketplaceBillingService marketplaceBillingService
    ) {
        this.currentUserService = currentUserService;
        this.userRepository = userRepository;
        this.asaasClient = asaasClient;
        this.billingProperties = billingProperties;
        this.marketplaceBillingService = marketplaceBillingService;
    }

    @Transactional
    public CheckoutResponse createProCheckout() {
        AppUser user = currentUserService.requireCreator();
        if (user.getPlan() == SubscriptionPlan.PRO && user.getSubscriptionStatus() == SubscriptionStatus.ACTIVE) {
            throw new BusinessException("Plano Pro já está ativo");
        }

        if (!billingProperties.isAsaasEnabled()) {
            return new CheckoutResponse(
                    SubscriptionPlan.PRO,
                    null,
                    "Configure ASAAS_API_KEY para habilitar checkout real."
            );
        }

        if (user.getAsaasCustomerId() == null) {
            user.setAsaasCustomerId(asaasClient.createCustomer(user.getName(), user.getEmail()));
        }

        AsaasClient.AsaasSubscriptionResult subscription = asaasClient.createSubscription(
                user.getAsaasCustomerId(),
                billingProperties.getAsaas().getMonthlyPrice()
        );
        user.setAsaasSubscriptionId(subscription.subscriptionId());
        userRepository.save(user);

        return new CheckoutResponse(
                SubscriptionPlan.PRO,
                subscription.checkoutUrl(),
                "Assinatura criada. Conclua o pagamento para ativar o plano Pro."
        );
    }

    @Transactional
    public void handleWebhook(String accessToken, JsonNode payload) {
        if (!billingProperties.isAsaasEnabled()) {
            return;
        }

        validateWebhookToken(accessToken);

        String event = payload.path("event").asText("");
        log.info("[billing:webhook] recebido event={}", event);

        JsonNode payment = payload.path("payment");

        if (marketplaceBillingService.handlePaymentWebhook(event, payment)) {
            log.info("[billing:webhook] processado event={} channel=marketplace", event);
            return;
        }

        String subscriptionId = payment.path("subscription").asText(null);
        if (subscriptionId == null || subscriptionId.isBlank()) {
            log.info("[billing:webhook] ignorado event={} motivo=sem_subscription", event);
            return;
        }

        AppUser user = userRepository.findByAsaasSubscriptionId(subscriptionId)
                .orElseThrow(() -> new BusinessException("Assinatura não encontrada"));

        boolean changed = switch (event) {
            case "PAYMENT_CONFIRMED", "PAYMENT_RECEIVED" -> activateSubscription(user);
            case "PAYMENT_OVERDUE" -> applyPastDue(user);
            case "PAYMENT_DELETED", "SUBSCRIPTION_DELETED" -> cancelSubscription(user);
            default -> false;
        };

        if (changed) {
            userRepository.save(user);
        }

        log.info("[billing:webhook] processado event={} subscriptionRef={} changed={}",
                event, LoggingSanitizer.refId(subscriptionId), changed);
    }

    private void validateWebhookToken(String accessToken) {
        String expectedToken = billingProperties.getAsaas().getWebhookToken();
        if (expectedToken == null || expectedToken.isBlank()) {
            throw new WebhookUnauthorizedException("Webhook Asaas não configurado");
        }

        if (accessToken == null || !constantTimeEquals(expectedToken, accessToken)) {
            throw new WebhookUnauthorizedException("Webhook Asaas inválido");
        }
    }

    private static boolean constantTimeEquals(String expected, String actual) {
        byte[] expectedBytes = expected.getBytes(StandardCharsets.UTF_8);
        byte[] actualBytes = actual.getBytes(StandardCharsets.UTF_8);
        return MessageDigest.isEqual(expectedBytes, actualBytes);
    }

    private boolean activateSubscription(AppUser user) {
        if (user.getPlan() == SubscriptionPlan.PRO && user.getSubscriptionStatus() == SubscriptionStatus.ACTIVE) {
            return false;
        }

        user.setPlan(SubscriptionPlan.PRO);
        user.setSubscriptionStatus(SubscriptionStatus.ACTIVE);
        user.setSubscriptionEndsAt(LocalDateTime.now().plusMonths(1));
        return true;
    }

    private boolean applyPastDue(AppUser user) {
        if (user.getSubscriptionStatus() == SubscriptionStatus.PAST_DUE) {
            return false;
        }

        user.setSubscriptionStatus(SubscriptionStatus.PAST_DUE);
        return true;
    }

    private boolean cancelSubscription(AppUser user) {
        if (user.getPlan() == SubscriptionPlan.FREE && user.getSubscriptionStatus() == SubscriptionStatus.CANCELED) {
            return false;
        }

        user.setSubscriptionStatus(SubscriptionStatus.CANCELED);
        user.setPlan(SubscriptionPlan.FREE);
        return true;
    }
}
