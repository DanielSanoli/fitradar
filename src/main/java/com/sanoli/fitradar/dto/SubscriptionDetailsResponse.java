package com.sanoli.fitradar.dto;

import com.sanoli.fitradar.domain.SubscriptionPlan;
import com.sanoli.fitradar.domain.SubscriptionStatus;

import java.time.LocalDateTime;

public record SubscriptionDetailsResponse(
        SubscriptionPlan plan,
        SubscriptionStatus status,
        LocalDateTime subscriptionEndsAt,
        LocalDateTime trialEndsAt,
        long trialDaysRemaining,
        boolean asaasConfigured,
        boolean canCancel,
        boolean canReactivate,
        boolean hasCpfCnpj,
        String message
) {
}
