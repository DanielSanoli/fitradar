package com.sanoli.fitradar.service;

import com.sanoli.fitradar.billing.AsaasClient;
import com.sanoli.fitradar.config.BillingProperties;
import com.sanoli.fitradar.domain.AppUser;
import com.sanoli.fitradar.domain.Program;
import com.sanoli.fitradar.domain.ProgramPurchase;
import com.sanoli.fitradar.domain.SubscriptionPlan;
import com.sanoli.fitradar.domain.SubscriptionStatus;
import com.sanoli.fitradar.domain.UserRole;
import com.sanoli.fitradar.repository.EnrollmentRepository;
import com.sanoli.fitradar.repository.ProgramPurchaseRepository;
import com.sanoli.fitradar.repository.ProgramRepository;
import com.sanoli.fitradar.repository.UserRepository;
import com.sanoli.fitradar.security.CurrentUserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MarketplaceBillingServiceTest {

    @Mock
    private CurrentUserService currentUserService;
    @Mock
    private UserRepository userRepository;
    @Mock
    private ProgramRepository programRepository;
    @Mock
    private ProgramPurchaseRepository purchaseRepository;
    @Mock
    private EnrollmentRepository enrollmentRepository;
    @Mock
    private AsaasClient asaasClient;

    private BillingProperties billingProperties;
    private PlanEntitlementService planEntitlementService;
    private MarketplaceBillingService service;

    private UUID creatorId;
    private UUID studentId;
    private UUID programId;

    @BeforeEach
    void setUp() {
        billingProperties = new BillingProperties();
        billingProperties.getMarketplace().setPlatformFeePercentFree(new BigDecimal("10.00"));
        billingProperties.getMarketplace().setPlatformFeePercentPro(BigDecimal.ZERO);

        planEntitlementService = new PlanEntitlementService(
                billingProperties,
                userRepository,
                programRepository
        );
        service = new MarketplaceBillingService(
                currentUserService,
                userRepository,
                programRepository,
                purchaseRepository,
                enrollmentRepository,
                asaasClient,
                billingProperties,
                planEntitlementService
        );

        creatorId = UUID.randomUUID();
        studentId = UUID.randomUUID();
        programId = UUID.randomUUID();
    }

    @Test
    void checkoutProgram_appliesTenPercentFeeForFreeCreator() {
        AppUser student = student();
        AppUser creator = creator(SubscriptionPlan.FREE, SubscriptionStatus.CANCELED);
        Program program = paidProgram(new BigDecimal("100.00"));

        stubCheckout(student, creator, program);

        service.checkoutProgram(student, programId);

        ProgramPurchase saved = captureSavedPurchase();
        assertThat(saved.getPlatformFee()).isEqualByComparingTo(new BigDecimal("10.00"));
        assertThat(saved.getCreatorNet()).isEqualByComparingTo(new BigDecimal("90.00"));
    }

    @Test
    void checkoutProgram_appliesZeroFeeForProCreator() {
        AppUser student = student();
        AppUser creator = creator(SubscriptionPlan.PRO, SubscriptionStatus.ACTIVE);
        Program program = paidProgram(new BigDecimal("100.00"));

        stubCheckout(student, creator, program);

        service.checkoutProgram(student, programId);

        ProgramPurchase saved = captureSavedPurchase();
        assertThat(saved.getPlatformFee()).isEqualByComparingTo(BigDecimal.ZERO.setScale(2));
        assertThat(saved.getCreatorNet()).isEqualByComparingTo(new BigDecimal("100.00"));
    }

    private void stubCheckout(AppUser student, AppUser creator, Program program) {
        when(programRepository.findByIdAndCreatorId(programId, creatorId)).thenReturn(Optional.of(program));
        when(userRepository.findById(creatorId)).thenReturn(Optional.of(creator));
        when(enrollmentRepository.existsByStudentIdAndProgramIdAndActiveTrue(studentId, programId)).thenReturn(false);
        when(purchaseRepository.existsByStudentIdAndProgramIdAndStatus(any(), any(), any())).thenReturn(false);
        when(purchaseRepository.save(any(ProgramPurchase.class))).thenAnswer(invocation -> {
            ProgramPurchase purchase = invocation.getArgument(0);
            if (purchase.getId() == null) {
                purchase.setId(UUID.randomUUID());
            }
            return purchase;
        });
    }

    private ProgramPurchase captureSavedPurchase() {
        ArgumentCaptor<ProgramPurchase> captor = ArgumentCaptor.forClass(ProgramPurchase.class);
        verify(purchaseRepository).save(captor.capture());
        return captor.getValue();
    }

    private AppUser student() {
        AppUser student = new AppUser();
        student.setId(studentId);
        student.setRole(UserRole.STUDENT);
        student.setCreatorId(creatorId);
        student.setName("Aluno");
        student.setEmail("aluno@test.com");
        return student;
    }

    private AppUser creator(SubscriptionPlan plan, SubscriptionStatus status) {
        AppUser creator = new AppUser();
        creator.setId(creatorId);
        creator.setRole(UserRole.CREATOR);
        creator.setPlan(plan);
        creator.setSubscriptionStatus(status);
        creator.setTrialEndsAt(LocalDateTime.now().minusDays(1));
        creator.setAsaasWalletId("wal_test");
        return creator;
    }

    private Program paidProgram(BigDecimal price) {
        Program program = new Program();
        program.setId(programId);
        program.setCreatorId(creatorId);
        program.setTitle("Premium");
        program.setActive(true);
        program.setPrice(price);
        return program;
    }
}
