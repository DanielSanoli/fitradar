package com.sanoli.fitradar.dto;

import java.math.BigDecimal;

public record MarketplaceStatusResponse(
        boolean connected,
        String walletId,
        /** Taxa aplicável ao plano atual do criador. */
        BigDecimal platformFeePercent,
        BigDecimal platformFeePercentFree,
        BigDecimal platformFeePercentPro
) {
}
