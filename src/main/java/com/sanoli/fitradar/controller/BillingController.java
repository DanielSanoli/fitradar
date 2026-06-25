package com.sanoli.fitradar.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.sanoli.fitradar.dto.CheckoutResponse;
import com.sanoli.fitradar.dto.MessageResponse;
import com.sanoli.fitradar.dto.ProCheckoutRequest;
import com.sanoli.fitradar.dto.SubscriptionDetailsResponse;
import com.sanoli.fitradar.dto.SubscriptionInvoiceResponse;
import com.sanoli.fitradar.service.BillingService;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/billing")
public class BillingController {

    private final BillingService billingService;

    public BillingController(BillingService billingService) {
        this.billingService = billingService;
    }

    @PostMapping("/checkout/pro")
    @Operation(summary = "Inicia checkout do plano Pro via Asaas")
    public ResponseEntity<CheckoutResponse> checkoutPro(
            @RequestBody(required = false) ProCheckoutRequest request
    ) {
        return ResponseEntity.ok(billingService.createProCheckout(request));
    }

    @GetMapping("/subscription")
    @Operation(summary = "Detalhes da assinatura SaaS do criador")
    public ResponseEntity<SubscriptionDetailsResponse> subscriptionDetails() {
        return ResponseEntity.ok(billingService.subscriptionDetails());
    }

    @GetMapping("/subscription/invoices")
    @Operation(summary = "Faturas/cobranças da assinatura Pro no Asaas")
    public ResponseEntity<List<SubscriptionInvoiceResponse>> subscriptionInvoices() {
        return ResponseEntity.ok(billingService.subscriptionInvoices());
    }

    @DeleteMapping("/subscription")
    @Operation(summary = "Cancela assinatura Pro via Asaas")
    public ResponseEntity<MessageResponse> cancelSubscription() {
        return ResponseEntity.ok(billingService.cancelCreatorSubscription());
    }

    @PostMapping("/subscription/reactivate")
    @Operation(summary = "Reativa assinatura Pro (novo checkout Asaas)")
    public ResponseEntity<CheckoutResponse> reactivateSubscription() {
        return ResponseEntity.ok(billingService.reactivateSubscription());
    }

    @PostMapping("/webhook")
    @Operation(summary = "Recebe eventos de pagamento do Asaas")
    public ResponseEntity<Void> webhook(
            @RequestHeader(value = "asaas-access-token", required = false) String accessToken,
            @RequestBody JsonNode payload
    ) {
        billingService.handleWebhook(accessToken, payload);
        return ResponseEntity.ok().build();
    }
}
