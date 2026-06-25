package com.sanoli.fitradar.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record SubscriptionInvoiceResponse(
        String id,
        String status,
        BigDecimal value,
        LocalDate dueDate,
        LocalDate paymentDate,
        String invoiceUrl
) {
}
