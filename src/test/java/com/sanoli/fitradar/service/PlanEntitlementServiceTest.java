package com.sanoli.fitradar.service;

import com.sanoli.fitradar.config.BillingProperties;
import com.sanoli.fitradar.domain.AppUser;
import com.sanoli.fitradar.domain.SubscriptionPlan;
import com.sanoli.fitradar.domain.SubscriptionStatus;
import com.sanoli.fitradar.domain.UserRole;
import com.sanoli.fitradar.exception.BusinessException;
import com.sanoli.fitradar.repository.ProgramRepository;
import com.sanoli.fitradar.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PlanEntitlementServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private ProgramRepository programRepository;

    private BillingProperties billingProperties;
    private PlanEntitlementService service;

    @BeforeEach
    void setUp() {
        billingProperties = new BillingProperties();
        billingProperties.getMarketplace().setPlatformFeePercentFree(new BigDecimal("10.00"));
        billingProperties.getMarketplace().setPlatformFeePercentPro(BigDecimal.ZERO);
        billingProperties.getLimits().setFreeMaxStudents(30);
        billingProperties.getLimits().setFreeMaxActivePrograms(3);
        service = new PlanEntitlementService(billingProperties, userRepository, programRepository);
    }

    @Test
    void resolvePlatformFeePercent_proActiveUsesProRate() {
        AppUser creator = creator(SubscriptionPlan.PRO, SubscriptionStatus.ACTIVE, null);

        assertThat(service.resolvePlatformFeePercent(creator))
                .isEqualByComparingTo(new BigDecimal("0.00"));
    }

    @Test
    void resolvePlatformFeePercent_freeUsesFreeRate() {
        AppUser creator = creator(SubscriptionPlan.FREE, SubscriptionStatus.CANCELED, LocalDateTime.now().minusDays(1));

        assertThat(service.resolvePlatformFeePercent(creator))
                .isEqualByComparingTo(new BigDecimal("10.00"));
    }

    @Test
    void assertCanAddStudent_blocksWhenFreeLimitReached() {
        AppUser creator = creator(SubscriptionPlan.FREE, SubscriptionStatus.CANCELED, LocalDateTime.now().minusDays(1));
        when(userRepository.countByCreatorIdAndRole(creator.getId(), UserRole.STUDENT)).thenReturn(30L);

        assertThatThrownBy(() -> service.assertCanAddStudent(creator))
                .isInstanceOf(BusinessException.class)
                .hasMessage(PlanEntitlementService.FREE_LIMIT_MESSAGE);
    }

    @Test
    void assertCanAddStudent_allowsDuringTrial() {
        AppUser creator = creator(SubscriptionPlan.FREE, SubscriptionStatus.TRIALING, LocalDateTime.now().plusDays(3));

        service.assertCanAddStudent(creator);
    }

    @Test
    void assertCanAddActiveProgram_blocksWhenFreeLimitReached() {
        AppUser creator = creator(SubscriptionPlan.FREE, SubscriptionStatus.CANCELED, LocalDateTime.now().minusDays(1));
        when(programRepository.countByCreatorIdAndActiveTrue(creator.getId())).thenReturn(3L);

        assertThatThrownBy(() -> service.assertCanAddActiveProgram(creator))
                .isInstanceOf(BusinessException.class)
                .hasMessage(PlanEntitlementService.FREE_LIMIT_MESSAGE);
    }

    private AppUser creator(SubscriptionPlan plan, SubscriptionStatus status, LocalDateTime trialEndsAt) {
        AppUser user = new AppUser();
        user.setId(UUID.randomUUID());
        user.setRole(UserRole.CREATOR);
        user.setPlan(plan);
        user.setSubscriptionStatus(status);
        user.setTrialEndsAt(trialEndsAt);
        return user;
    }
}
