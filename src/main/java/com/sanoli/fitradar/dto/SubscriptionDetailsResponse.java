package com.sanoli.fitradar.dto;

import com.sanoli.fitradar.domain.SubscriptionPlan;
import com.sanoli.fitradar.domain.SubscriptionStatus;

import java.math.BigDecimal;
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
        boolean hasProFeatures,
        boolean subjectToFreeLimits,
        BigDecimal marketplaceFeePercentCurrent,
        BigDecimal marketplaceFeePercentFree,
        BigDecimal marketplaceFeePercentPro,
        int freeMaxStudents,
        int freeMaxActivePrograms,
        long currentStudentCount,
        long currentActiveProgramCount,
        String message
) {
}
