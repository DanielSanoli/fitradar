package com.sanoli.fitradar.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.sanoli.fitradar.billing.AsaasClient;
import com.sanoli.fitradar.billing.MarketplaceSplitCalculator;
import com.sanoli.fitradar.config.BillingProperties;
import com.sanoli.fitradar.domain.AppUser;
import com.sanoli.fitradar.domain.Enrollment;
import com.sanoli.fitradar.domain.Program;
import com.sanoli.fitradar.domain.ProgramPurchase;
import com.sanoli.fitradar.domain.PurchaseStatus;
import com.sanoli.fitradar.dto.EnrollmentResponse;
import com.sanoli.fitradar.dto.MarketplaceConnectRequest;
import com.sanoli.fitradar.dto.MarketplaceStatusResponse;
import com.sanoli.fitradar.dto.ProgramCheckoutResponse;
import com.sanoli.fitradar.dto.ProgramPurchaseResponse;
import com.sanoli.fitradar.dto.StudentProgramResponse;
import com.sanoli.fitradar.exception.BusinessException;
import com.sanoli.fitradar.exception.ForbiddenException;
import com.sanoli.fitradar.exception.ResourceNotFoundException;
import com.sanoli.fitradar.repository.EnrollmentRepository;
import com.sanoli.fitradar.repository.ProgramPurchaseRepository;
import com.sanoli.fitradar.repository.ProgramRepository;
import com.sanoli.fitradar.repository.UserRepository;
import com.sanoli.fitradar.security.CurrentUserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Cobrança aluno→criador com split Asaas. A taxa da plataforma fica na conta raiz (FitRadar).
 */
@Service
public class MarketplaceBillingService {

    private final CurrentUserService currentUserService;
    private final UserRepository userRepository;
    private final ProgramRepository programRepository;
    private final ProgramPurchaseRepository purchaseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final AsaasClient asaasClient;
    private final BillingProperties billingProperties;
    private final PlanEntitlementService planEntitlementService;

    public MarketplaceBillingService(
            CurrentUserService currentUserService,
            UserRepository userRepository,
            ProgramRepository programRepository,
            ProgramPurchaseRepository purchaseRepository,
            EnrollmentRepository enrollmentRepository,
            AsaasClient asaasClient,
            BillingProperties billingProperties,
            PlanEntitlementService planEntitlementService
    ) {
        this.currentUserService = currentUserService;
        this.userRepository = userRepository;
        this.programRepository = programRepository;
        this.purchaseRepository = purchaseRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.asaasClient = asaasClient;
        this.billingProperties = billingProperties;
        this.planEntitlementService = planEntitlementService;
    }

    @Transactional
    public MarketplaceStatusResponse connect(MarketplaceConnectRequest request) {
        AppUser creator = currentUserService.requireCreator();
        String walletId = request.walletId().trim();
        if (walletId.isBlank()) {
            throw new BusinessException("walletId é obrigatório");
        }
        creator.setAsaasWalletId(walletId);
        userRepository.save(creator);
        return status(creator);
    }

    @Transactional(readOnly = true)
    public MarketplaceStatusResponse statusForCurrentCreator() {
        return status(currentUserService.requireCreator());
    }

    @Transactional(readOnly = true)
    public List<ProgramPurchaseResponse> salesForCurrentCreator() {
        UUID creatorId = currentUserService.requireCreator().getId();
        return purchaseRepository.findByCreatorIdOrderByCreatedAtDesc(creatorId).stream()
                .map(purchase -> {
                    String programTitle = programRepository.findById(purchase.getProgramId())
                            .map(Program::getTitle)
                            .orElse("—");
                    String studentName = userRepository.findById(purchase.getStudentId())
                            .map(AppUser::getName)
                            .orElse("—");
                    return ProgramPurchaseResponse.fromEntity(purchase, programTitle, studentName);
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public List<StudentProgramResponse> catalogForStudent(AppUser student) {
        if (student.getCreatorId() == null) {
            return List.of();
        }
        return programRepository.findByCreatorIdAndActiveTrue(student.getCreatorId()).stream()
                .map(program -> StudentProgramResponse.fromEntity(
                        program,
                        enrollmentRepository.existsByStudentIdAndProgramIdAndActiveTrue(student.getId(), program.getId()),
                        purchaseRepository.existsByStudentIdAndProgramIdAndStatus(
                                student.getId(), program.getId(), PurchaseStatus.PENDING)
                ))
                .toList();
    }

    @Transactional
    public EnrollmentResponse enrollFreeProgram(AppUser student, UUID programId) {
        Program program = requireStudentProgram(student, programId);
        if (program.isPaid()) {
            throw new BusinessException("Este programa é pago — use checkout para comprar");
        }
        Enrollment enrollment = createEnrollment(student.getId(), program);
        return EnrollmentResponse.fromEntity(enrollment, program.getTitle());
    }

    @Transactional
    public ProgramCheckoutResponse checkoutProgram(AppUser student, UUID programId) {
        Program program = requireStudentProgram(student, programId);
        if (!program.isPaid()) {
            throw new BusinessException("Este programa é gratuito — matricule-se diretamente");
        }
        if (enrollmentRepository.existsByStudentIdAndProgramIdAndActiveTrue(student.getId(), programId)) {
            throw new BusinessException("Você já está matriculado neste programa");
        }
        if (purchaseRepository.existsByStudentIdAndProgramIdAndStatus(
                student.getId(), programId, PurchaseStatus.PENDING)) {
            throw new BusinessException("Já existe uma compra pendente deste programa");
        }

        AppUser creator = userRepository.findById(student.getCreatorId())
                .orElseThrow(() -> new BusinessException("Criador não encontrado"));
        if (creator.getAsaasWalletId() == null || creator.getAsaasWalletId().isBlank()) {
            throw new BusinessException("Seu criador ainda não configurou recebimentos");
        }

        MarketplaceSplitCalculator.SplitAmounts split = MarketplaceSplitCalculator.calculate(
                program.getPrice(),
                resolvePlatformFee(creator)
        );

        ProgramPurchase purchase = new ProgramPurchase();
        purchase.setCreatorId(creator.getId());
        purchase.setStudentId(student.getId());
        purchase.setProgramId(program.getId());
        purchase.setAmount(split.amount());
        purchase.setPlatformFee(split.platformFee());
        purchase.setCreatorNet(split.creatorNet());
        purchase.setStatus(PurchaseStatus.PENDING);
        purchase = purchaseRepository.save(purchase);

        if (!billingProperties.isAsaasEnabled()) {
            return new ProgramCheckoutResponse(
                    purchase.getId(),
                    null,
                    split.amount(),
                    split.platformFee(),
                    split.creatorNet(),
                    "Configure ASAAS_API_KEY para checkout real com split."
            );
        }

        if (student.getAsaasCustomerId() == null) {
            student.setAsaasCustomerId(asaasClient.createCustomer(student.getName(), student.getEmail(), null));
            userRepository.save(student);
        }

        AsaasClient.AsaasPaymentResult payment = asaasClient.createPaymentWithSplit(
                student.getAsaasCustomerId(),
                split.amount(),
                "Programa: " + program.getTitle(),
                purchase.getId().toString(),
                creator.getAsaasWalletId(),
                split.creatorSplitPercent()
        );
        purchase.setAsaasPaymentId(payment.paymentId());
        purchaseRepository.save(purchase);

        return new ProgramCheckoutResponse(
                purchase.getId(),
                payment.checkoutUrl(),
                split.amount(),
                split.platformFee(),
                split.creatorNet(),
                "Conclua o pagamento para acessar o programa."
        );
    }

    @Transactional
    public boolean handlePaymentWebhook(String event, JsonNode payment) {
        String externalReference = payment.path("externalReference").asText(null);
        if (externalReference == null || externalReference.isBlank()) {
            return false;
        }

        UUID purchaseId;
        try {
            purchaseId = UUID.fromString(externalReference);
        } catch (IllegalArgumentException exception) {
            return false;
        }

        ProgramPurchase purchase = purchaseRepository.findById(purchaseId).orElse(null);
        if (purchase == null) {
            return false;
        }

        return switch (event) {
            case "PAYMENT_CONFIRMED", "PAYMENT_RECEIVED" -> confirmPurchase(purchase);
            case "PAYMENT_DELETED", "PAYMENT_REFUNDED" -> cancelPurchase(purchase);
            default -> false;
        };
    }

    private boolean confirmPurchase(ProgramPurchase purchase) {
        if (purchase.getStatus() == PurchaseStatus.CONFIRMED) {
            return false;
        }
        purchase.setStatus(PurchaseStatus.CONFIRMED);
        purchase.setConfirmedAt(Instant.now());
        purchaseRepository.save(purchase);

        if (!enrollmentRepository.existsByStudentIdAndProgramIdAndActiveTrue(
                purchase.getStudentId(), purchase.getProgramId())) {
            createEnrollment(purchase.getStudentId(),
                    programRepository.findById(purchase.getProgramId()).orElseThrow());
        }
        return true;
    }

    private boolean cancelPurchase(ProgramPurchase purchase) {
        if (purchase.getStatus() == PurchaseStatus.CANCELED || purchase.getStatus() == PurchaseStatus.FAILED) {
            return false;
        }
        purchase.setStatus(PurchaseStatus.CANCELED);
        purchaseRepository.save(purchase);
        return true;
    }

    private Enrollment createEnrollment(UUID studentId, Program program) {
        if (enrollmentRepository.existsByStudentIdAndProgramIdAndActiveTrue(studentId, program.getId())) {
            throw new BusinessException("Aluno já está matriculado neste programa");
        }
        Enrollment enrollment = new Enrollment();
        enrollment.setStudentId(studentId);
        enrollment.setProgramId(program.getId());
        enrollment.setStartDate(LocalDate.now());
        enrollment.setActive(true);
        return enrollmentRepository.save(enrollment);
    }

    private Program requireStudentProgram(AppUser student, UUID programId) {
        if (student.getCreatorId() == null) {
            throw new ForbiddenException("Aluno sem criador associado");
        }
        Program program = programRepository.findByIdAndCreatorId(programId, student.getCreatorId())
                .orElseThrow(() -> new ResourceNotFoundException("Programa não encontrado: " + programId));
        if (!program.isActive()) {
            throw new BusinessException("Programa indisponível");
        }
        return program;
    }

    private MarketplaceStatusResponse status(AppUser creator) {
        return new MarketplaceStatusResponse(
                creator.getAsaasWalletId() != null && !creator.getAsaasWalletId().isBlank(),
                creator.getAsaasWalletId(),
                resolvePlatformFee(creator),
                billingProperties.getMarketplace().getPlatformFeePercentFree(),
                billingProperties.getMarketplace().getPlatformFeePercentPro()
        );
    }

    private java.math.BigDecimal resolvePlatformFee(AppUser creator) {
        return planEntitlementService.resolvePlatformFeePercent(creator);
    }
}
