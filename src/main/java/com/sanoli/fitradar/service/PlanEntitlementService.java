package com.sanoli.fitradar.service;

import com.sanoli.fitradar.config.BillingProperties;
import com.sanoli.fitradar.domain.AppUser;
import com.sanoli.fitradar.domain.SubscriptionPlan;
import com.sanoli.fitradar.domain.SubscriptionStatus;
import com.sanoli.fitradar.domain.UserRole;
import com.sanoli.fitradar.exception.BusinessException;
import com.sanoli.fitradar.repository.ProgramRepository;
import com.sanoli.fitradar.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
public class PlanEntitlementService {

    public static final String FREE_LIMIT_MESSAGE =
            "Limite do plano Free atingido — assine o Pro para liberar alunos/programas ilimitados";

    private final BillingProperties billingProperties;
    private final UserRepository userRepository;
    private final ProgramRepository programRepository;

    public PlanEntitlementService(
            BillingProperties billingProperties,
            UserRepository userRepository,
            ProgramRepository programRepository
    ) {
        this.billingProperties = billingProperties;
        this.userRepository = userRepository;
        this.programRepository = programRepository;
    }

    public BigDecimal resolvePlatformFeePercent(AppUser creator) {
        if (creator.getPlan() == SubscriptionPlan.PRO
                && creator.getSubscriptionStatus() == SubscriptionStatus.ACTIVE) {
            return billingProperties.getMarketplace().getPlatformFeePercentPro();
        }
        return billingProperties.getMarketplace().getPlatformFeePercentFree();
    }

    public void assertCanAddStudent(AppUser creator) {
        if (!creator.isSubjectToFreeLimits()) {
            return;
        }
        long count = userRepository.countByCreatorIdAndRole(creator.getId(), UserRole.STUDENT);
        if (count >= billingProperties.getLimits().getFreeMaxStudents()) {
            throw new BusinessException(FREE_LIMIT_MESSAGE);
        }
    }

    public void assertCanAddActiveProgram(AppUser creator) {
        if (!creator.isSubjectToFreeLimits()) {
            return;
        }
        long count = programRepository.countByCreatorIdAndActiveTrue(creator.getId());
        if (count >= billingProperties.getLimits().getFreeMaxActivePrograms()) {
            throw new BusinessException(FREE_LIMIT_MESSAGE);
        }
    }

    public long countStudents(AppUser creator) {
        return userRepository.countByCreatorIdAndRole(creator.getId(), UserRole.STUDENT);
    }

    public long countActivePrograms(AppUser creator) {
        return programRepository.countByCreatorIdAndActiveTrue(creator.getId());
    }
}
