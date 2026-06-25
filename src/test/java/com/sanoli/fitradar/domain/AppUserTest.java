package com.sanoli.fitradar.domain;

import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

class AppUserTest {

    @Test
    void hasProFeatures_activePro() {
        AppUser user = creator();
        user.setPlan(SubscriptionPlan.PRO);
        user.setSubscriptionStatus(SubscriptionStatus.ACTIVE);

        assertThat(user.hasProFeatures()).isTrue();
        assertThat(user.isSubjectToFreeLimits()).isFalse();
    }

    @Test
    void hasProFeatures_trialingNotExpired() {
        AppUser user = creator();
        user.setPlan(SubscriptionPlan.FREE);
        user.setSubscriptionStatus(SubscriptionStatus.TRIALING);
        user.setTrialEndsAt(LocalDateTime.now().plusDays(5));

        assertThat(user.hasProFeatures()).isTrue();
        assertThat(user.isSubjectToFreeLimits()).isFalse();
    }

    @Test
    void hasProFeatures_freeAfterTrialExpired() {
        AppUser user = creator();
        user.setPlan(SubscriptionPlan.FREE);
        user.setSubscriptionStatus(SubscriptionStatus.TRIALING);
        user.setTrialEndsAt(LocalDateTime.now().minusDays(1));

        assertThat(user.hasProFeatures()).isFalse();
        assertThat(user.isSubjectToFreeLimits()).isTrue();
    }

    @Test
    void hasBasicCreatorAccess_alwaysForCreator() {
        AppUser user = creator();
        user.setSubscriptionStatus(SubscriptionStatus.CANCELED);
        user.setTrialEndsAt(LocalDateTime.now().minusDays(30));

        assertThat(user.hasBasicCreatorAccess()).isTrue();
    }

    private AppUser creator() {
        AppUser user = new AppUser();
        user.setRole(UserRole.CREATOR);
        return user;
    }
}
