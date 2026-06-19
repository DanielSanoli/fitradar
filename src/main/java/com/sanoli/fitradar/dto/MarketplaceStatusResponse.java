package com.sanoli.fitradar.dto;

import java.math.BigDecimal;

public record MarketplaceStatusResponse(
        boolean connected,
        String walletId,
        BigDecimal platformFeePercent
) {
}
