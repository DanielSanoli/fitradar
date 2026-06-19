package com.sanoli.fitradar.dto;

import com.sanoli.fitradar.domain.SubscriptionPlan;

public record CheckoutResponse(
        SubscriptionPlan plan,
        String checkoutUrl,
        String message
) {
}
