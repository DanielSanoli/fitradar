package com.sanoli.fitradar.dto;

import jakarta.validation.constraints.NotBlank;

public record MarketplaceConnectRequest(
        @NotBlank(message = "walletId é obrigatório")
        String walletId
) {
}
