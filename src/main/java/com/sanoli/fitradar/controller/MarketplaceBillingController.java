package com.sanoli.fitradar.controller;

import com.sanoli.fitradar.dto.MarketplaceConnectRequest;
import com.sanoli.fitradar.dto.MarketplaceStatusResponse;
import com.sanoli.fitradar.dto.ProgramPurchaseResponse;
import com.sanoli.fitradar.service.MarketplaceBillingService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/billing/marketplace")
public class MarketplaceBillingController {

    private final MarketplaceBillingService marketplaceBillingService;

    public MarketplaceBillingController(MarketplaceBillingService marketplaceBillingService) {
        this.marketplaceBillingService = marketplaceBillingService;
    }

    @PostMapping("/connect")
    @Operation(summary = "Conecta a carteira Asaas do criador para receber vendas (split)")
    public ResponseEntity<MarketplaceStatusResponse> connect(@Valid @RequestBody MarketplaceConnectRequest request) {
        return ResponseEntity.ok(marketplaceBillingService.connect(request));
    }

    @GetMapping("/status")
    @Operation(summary = "Status da conta de recebimentos do criador")
    public ResponseEntity<MarketplaceStatusResponse> status() {
        return ResponseEntity.ok(marketplaceBillingService.statusForCurrentCreator());
    }

    @GetMapping("/sales")
    @Operation(summary = "Vendas de programas do criador (com taxa da plataforma)")
    public ResponseEntity<List<ProgramPurchaseResponse>> sales() {
        return ResponseEntity.ok(marketplaceBillingService.salesForCurrentCreator());
    }
}
