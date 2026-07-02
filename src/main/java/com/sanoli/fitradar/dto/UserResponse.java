package com.sanoli.fitradar.dto;

import com.sanoli.fitradar.domain.AppUser;
import com.sanoli.fitradar.domain.SubscriptionPlan;
import com.sanoli.fitradar.domain.SubscriptionStatus;
import com.sanoli.fitradar.domain.UserRole;

import java.time.LocalDateTime;
import java.util.UUID;

public record UserResponse(
        UUID id,
        String name,
        String email,
        UserRole role,
        UUID creatorId,
        SubscriptionPlan plan,
        SubscriptionStatus subscriptionStatus,
        LocalDateTime trialEndsAt,
        LocalDateTime subscriptionEndsAt,
        boolean emailVerified,
        boolean mustChangePassword,
        boolean termsAccepted,
        boolean anamneseCompleted,
        boolean accessAllowed,
        boolean hasProFeatures,
        String accessMessage,
        long trialDaysRemaining
) {
    public static UserResponse fromEntity(AppUser user) {
        return fromEntity(user, true);
    }

    public static UserResponse fromEntity(AppUser user, boolean anamneseCompleted) {
        return new UserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                user.getCreatorId(),
                user.getPlan(),
                user.getSubscriptionStatus(),
                user.getTrialEndsAt(),
                user.getSubscriptionEndsAt(),
                user.isEmailVerified(),
                user.isMustChangePassword(),
                user.hasAcceptedTerms(),
                anamneseCompleted,
                user.hasBasicCreatorAccess(),
                user.hasProFeatures(),
                user.getAccessMessage(),
                user.getTrialDaysRemaining()
        );
    }
}
