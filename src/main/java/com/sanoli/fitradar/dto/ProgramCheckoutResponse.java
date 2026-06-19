package com.sanoli.fitradar.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record ProgramCheckoutResponse(
        UUID purchaseId,
        String checkoutUrl,
        BigDecimal amount,
        BigDecimal platformFee,
        BigDecimal creatorNet,
        String message
) {
}
