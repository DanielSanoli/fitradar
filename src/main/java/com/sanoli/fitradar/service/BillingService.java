package com.sanoli.fitradar.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.sanoli.fitradar.billing.AsaasClient;
import com.sanoli.fitradar.config.BillingProperties;
import com.sanoli.fitradar.domain.AppUser;
import com.sanoli.fitradar.domain.SubscriptionPlan;
import com.sanoli.fitradar.domain.SubscriptionStatus;
import com.sanoli.fitradar.dto.CheckoutResponse;
import com.sanoli.fitradar.dto.MessageResponse;
import com.sanoli.fitradar.dto.ProCheckoutRequest;
import com.sanoli.fitradar.dto.SubscriptionDetailsResponse;
import com.sanoli.fitradar.dto.SubscriptionInvoiceResponse;
import com.sanoli.fitradar.exception.BusinessException;
import com.sanoli.fitradar.exception.WebhookUnauthorizedException;
import com.sanoli.fitradar.observability.LoggingSanitizer;
import com.sanoli.fitradar.repository.UserRepository;
import com.sanoli.fitradar.security.CurrentUserService;
import com.sanoli.fitradar.util.CpfCnpjValidator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class BillingService {

    private static final Logger log = LoggerFactory.getLogger(BillingService.class);

    private final CurrentUserService currentUserService;
    private final UserRepository userRepository;
    private final AsaasClient asaasClient;
    private final BillingProperties billingProperties;
    private final MarketplaceBillingService marketplaceBillingService;
    private final PlanEntitlementService planEntitlementService;

    public BillingService(
            CurrentUserService currentUserService,
            UserRepository userRepository,
            AsaasClient asaasClient,
            BillingProperties billingProperties,
            MarketplaceBillingService marketplaceBillingService,
            PlanEntitlementService planEntitlementService
    ) {
        this.currentUserService = currentUserService;
        this.userRepository = userRepository;
        this.asaasClient = asaasClient;
        this.billingProperties = billingProperties;
        this.marketplaceBillingService = marketplaceBillingService;
        this.planEntitlementService = planEntitlementService;
    }

    @Transactional
    public CheckoutResponse createProCheckout(ProCheckoutRequest request) {
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

        String cpfCnpj = resolveCpfCnpj(request, user);
        user.setCpfCnpj(cpfCnpj);

        if (user.getAsaasCustomerId() == null) {
            user.setAsaasCustomerId(asaasClient.createCustomer(user.getName(), user.getEmail(), cpfCnpj));
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

    private String resolveCpfCnpj(ProCheckoutRequest request, AppUser user) {
        String raw = request != null && request.cpfCnpj() != null && !request.cpfCnpj().isBlank()
                ? request.cpfCnpj()
                : user.getCpfCnpj();
        if (raw == null || raw.isBlank()) {
            throw new BusinessException("Informe seu CPF ou CNPJ para assinar o plano Pro");
        }
        String digits = CpfCnpjValidator.sanitize(raw);
        if (!CpfCnpjValidator.isValid(digits)) {
            throw new BusinessException("CPF ou CNPJ inválido");
        }
        return digits;
    }

    @Transactional(readOnly = true)
    public SubscriptionDetailsResponse subscriptionDetails() {
        AppUser user = currentUserService.requireCreator();
        boolean asaasConfigured = billingProperties.isAsaasEnabled();
        boolean activePro = user.getPlan() == SubscriptionPlan.PRO
                && user.getSubscriptionStatus() == SubscriptionStatus.ACTIVE;
        boolean canCancel = asaasConfigured
                && user.getAsaasSubscriptionId() != null
                && user.getPlan() == SubscriptionPlan.PRO
                && (user.getSubscriptionStatus() == SubscriptionStatus.ACTIVE
                || user.getSubscriptionStatus() == SubscriptionStatus.PAST_DUE);
        boolean canReactivate = asaasConfigured && !activePro;

        String message = null;
        if (!asaasConfigured) {
            message = "Configure ASAAS_API_KEY para gestão de assinatura via Asaas.";
        } else if (canCancel) {
            message = "Cancelamento via Asaas — o acesso Pro encerra conforme o ciclo da assinatura.";
        }

        return new SubscriptionDetailsResponse(
                user.getPlan(),
                user.getSubscriptionStatus(),
                user.getSubscriptionEndsAt(),
                user.getTrialEndsAt(),
                user.getTrialDaysRemaining(),
                asaasConfigured,
                canCancel,
                canReactivate,
                hasCpfCnpj(user),
                user.hasProFeatures(),
                user.isSubjectToFreeLimits(),
                planEntitlementService.resolvePlatformFeePercent(user),
                billingProperties.getMarketplace().getPlatformFeePercentFree(),
                billingProperties.getMarketplace().getPlatformFeePercentPro(),
                billingProperties.getLimits().getFreeMaxStudents(),
                billingProperties.getLimits().getFreeMaxActivePrograms(),
                planEntitlementService.countStudents(user),
                planEntitlementService.countActivePrograms(user),
                message
        );
    }

    @Transactional(readOnly = true)
    public List<SubscriptionInvoiceResponse> subscriptionInvoices() {
        AppUser user = currentUserService.requireCreator();
        if (!billingProperties.isAsaasEnabled() || user.getAsaasSubscriptionId() == null) {
            return List.of();
        }

        JsonNode response = asaasClient.listPaymentsBySubscription(user.getAsaasSubscriptionId(), 20);
        JsonNode data = response.path("data");
        if (!data.isArray()) {
            return List.of();
        }

        List<SubscriptionInvoiceResponse> invoices = new ArrayList<>();
        for (JsonNode payment : data) {
            invoices.add(new SubscriptionInvoiceResponse(
                    payment.path("id").asText(""),
                    payment.path("status").asText("UNKNOWN"),
                    payment.path("value").decimalValue(),
                    parseDateOrNull(payment.path("dueDate").asText(null)),
                    parseDateOrNull(payment.path("paymentDate").asText(null)),
                    textOrNull(payment, "invoiceUrl")
            ));
        }
        return invoices;
    }

    @Transactional
    public MessageResponse cancelCreatorSubscription() {
        AppUser user = currentUserService.requireCreator();
        if (!billingProperties.isAsaasEnabled()) {
            throw new BusinessException("Integração Asaas não configurada");
        }
        if (user.getAsaasSubscriptionId() == null) {
            throw new BusinessException("Nenhuma assinatura Asaas vinculada");
        }
        if (user.getPlan() != SubscriptionPlan.PRO
                || (user.getSubscriptionStatus() != SubscriptionStatus.ACTIVE
                && user.getSubscriptionStatus() != SubscriptionStatus.PAST_DUE)) {
            throw new BusinessException("Assinatura Pro não está ativa para cancelamento");
        }

        String subscriptionId = user.getAsaasSubscriptionId();
        asaasClient.deleteSubscription(subscriptionId);
        applyLocalCancellation(user);
        user.setAsaasSubscriptionId(null);
        userRepository.save(user);

        log.info("[billing:cancel] subscriptionRef={} creatorId={}",
                LoggingSanitizer.refId(subscriptionId), user.getId());
        return new MessageResponse("Assinatura cancelada. Você pode reativar quando quiser.");
    }

    @Transactional
    public CheckoutResponse reactivateSubscription() {
        return createProCheckout(null);
    }

    private static boolean hasCpfCnpj(AppUser user) {
        return user.getCpfCnpj() != null && !user.getCpfCnpj().isBlank();
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
            case "PAYMENT_DELETED", "SUBSCRIPTION_DELETED" -> cancelFromWebhook(user, event);
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

    private boolean cancelFromWebhook(AppUser user, String event) {
        boolean changed = applyLocalCancellation(user);
        if ("SUBSCRIPTION_DELETED".equals(event) && user.getAsaasSubscriptionId() != null) {
            user.setAsaasSubscriptionId(null);
            return true;
        }
        return changed;
    }

    private boolean applyLocalCancellation(AppUser user) {
        if (user.getPlan() == SubscriptionPlan.FREE && user.getSubscriptionStatus() == SubscriptionStatus.CANCELED) {
            return false;
        }

        user.setSubscriptionStatus(SubscriptionStatus.CANCELED);
        user.setPlan(SubscriptionPlan.FREE);
        return true;
    }

    private static LocalDate parseDateOrNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return LocalDate.parse(value);
    }

    private static String textOrNull(JsonNode node, String field) {
        JsonNode value = node.get(field);
        return value == null || value.isNull() ? null : value.asText();
    }
}
