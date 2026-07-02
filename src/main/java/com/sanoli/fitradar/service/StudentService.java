package com.sanoli.fitradar.service;

import com.sanoli.fitradar.config.PaginationProperties;
import com.sanoli.fitradar.domain.AppUser;
import com.sanoli.fitradar.domain.Enrollment;
import com.sanoli.fitradar.domain.Program;
import com.sanoli.fitradar.domain.UserRole;
import com.sanoli.fitradar.dto.EnrollmentRequest;
import com.sanoli.fitradar.dto.EnrollmentResponse;
import com.sanoli.fitradar.dto.PageResponse;
import com.sanoli.fitradar.dto.StudentInviteRequest;
import com.sanoli.fitradar.dto.StudentInviteResponse;
import com.sanoli.fitradar.dto.StudentResendInviteResponse;
import com.sanoli.fitradar.dto.StudentResponse;
import com.sanoli.fitradar.exception.BusinessException;
import com.sanoli.fitradar.exception.ResourceNotFoundException;
import com.sanoli.fitradar.repository.EnrollmentRepository;
import com.sanoli.fitradar.repository.ProgramRepository;
import com.sanoli.fitradar.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDate;
import java.util.Base64;
import java.util.List;
import java.util.UUID;

/**
 * Gestão de alunos pelo criador (tenant). Toda query é escopada por creatorId.
 */
@Service
public class StudentService {

    private static final Logger log = LoggerFactory.getLogger(StudentService.class);
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final ProgramRepository programRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final PaginationProperties paginationProperties;
    private final PlanEntitlementService planEntitlementService;
    private final String publicBaseUrl;

    public StudentService(
            UserRepository userRepository,
            ProgramRepository programRepository,
            EnrollmentRepository enrollmentRepository,
            PasswordEncoder passwordEncoder,
            EmailService emailService,
            PaginationProperties paginationProperties,
            PlanEntitlementService planEntitlementService,
            @Value("${app.public-base-url:http://localhost:8080}") String publicBaseUrl
    ) {
        this.userRepository = userRepository;
        this.programRepository = programRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
        this.paginationProperties = paginationProperties;
        this.planEntitlementService = planEntitlementService;
        this.publicBaseUrl = publicBaseUrl;
    }

    @Transactional
    public StudentInviteResponse invite(AppUser creator, StudentInviteRequest request) {
        planEntitlementService.assertCanAddStudent(creator);
        String email = request.email().trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new BusinessException("Já existe um usuário com este email");
        }

        String tempPassword = generateTempPassword();
        AppUser student = new AppUser();
        student.setName(request.name().trim());
        student.setEmail(email);
        student.setPasswordHash(passwordEncoder.encode(tempPassword));
        student.setRole(UserRole.STUDENT);
        student.setCreatorId(creator.getId());
        student.setMustChangePassword(true);
        AppUser saved = userRepository.save(student);

        boolean emailSent = sendInviteEmail(email, creator.getName(), tempPassword);

        return new StudentInviteResponse(
                saved.getId(), saved.getName(), saved.getEmail(), tempPassword, emailSent);
    }

    @Transactional
    public StudentResendInviteResponse resendInvite(AppUser creator, UUID studentId) {
        AppUser student = requireStudent(creator.getId(), studentId);
        if (!student.isMustChangePassword()) {
            throw new BusinessException("Aluno já ativou o acesso");
        }

        String tempPassword = generateTempPassword();
        student.setPasswordHash(passwordEncoder.encode(tempPassword));
        student.setMustChangePassword(true);
        userRepository.save(student);

        boolean emailSent = sendInviteEmail(student.getEmail(), creator.getName(), tempPassword);
        return new StudentResendInviteResponse(tempPassword, emailSent);
    }

    @Transactional(readOnly = true)
    public PageResponse<StudentResponse> list(UUID creatorId, Integer page, Integer size) {
        Page<AppUser> students = userRepository.findByCreatorIdAndRole(
                creatorId,
                UserRole.STUDENT,
                paginationProperties.toPageable(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));
        return PageResponse.from(students.map(StudentResponse::fromEntity));
    }

    @Transactional(readOnly = true)
    public StudentResponse get(UUID creatorId, UUID studentId) {
        return StudentResponse.fromEntity(requireStudent(creatorId, studentId));
    }

    @Transactional(readOnly = true)
    public AppUser requireStudent(UUID creatorId, UUID studentId) {
        AppUser student = userRepository.findByIdAndCreatorId(studentId, creatorId)
                .orElseThrow(() -> new ResourceNotFoundException("Aluno não encontrado: " + studentId));
        if (student.getRole() != UserRole.STUDENT) {
            throw new ResourceNotFoundException("Aluno não encontrado: " + studentId);
        }
        return student;
    }

    @Transactional
    public EnrollmentResponse enroll(AppUser creator, UUID studentId, EnrollmentRequest request) {
        requireStudent(creator.getId(), studentId);
        Program program = programRepository.findByIdAndCreatorId(request.programId(), creator.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Programa não encontrado: " + request.programId()));

        if (enrollmentRepository.existsByStudentIdAndProgramIdAndActiveTrue(studentId, program.getId())) {
            throw new BusinessException("Aluno já está matriculado neste programa");
        }

        Enrollment enrollment = new Enrollment();
        enrollment.setStudentId(studentId);
        enrollment.setProgramId(program.getId());
        enrollment.setStartDate(request.startDate() != null ? request.startDate() : LocalDate.now());
        enrollment.setActive(true);
        Enrollment saved = enrollmentRepository.save(enrollment);
        return EnrollmentResponse.fromEntity(saved, program.getTitle());
    }

    @Transactional(readOnly = true)
    public List<EnrollmentResponse> listEnrollments(UUID creatorId, UUID studentId) {
        requireStudent(creatorId, studentId);
        List<Enrollment> enrollments = enrollmentRepository.findByStudentId(studentId);
        if (enrollments.isEmpty()) {
            return List.of();
        }
        var programIds = enrollments.stream().map(Enrollment::getProgramId).distinct().toList();
        var titlesById = programRepository.findByIdIn(programIds).stream()
                .collect(java.util.stream.Collectors.toMap(Program::getId, Program::getTitle));
        return enrollments.stream()
                .map(enrollment -> EnrollmentResponse.fromEntity(
                        enrollment,
                        titlesById.getOrDefault(enrollment.getProgramId(), "—")))
                .toList();
    }

    @Transactional
    public void deactivateEnrollment(UUID creatorId, UUID studentId, UUID enrollmentId) {
        requireStudent(creatorId, studentId);
        Enrollment enrollment = enrollmentRepository.findByIdAndStudentId(enrollmentId, studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Matrícula não encontrada: " + enrollmentId));
        enrollment.setActive(false);
        enrollmentRepository.save(enrollment);
    }

    private boolean sendInviteEmail(String email, String creatorName, String tempPassword) {
        try {
            emailService.sendStudentInvite(email, creatorName, publicBaseUrl + "/login", tempPassword);
            return true;
        } catch (RuntimeException exception) {
            log.warn("Falha ao enviar convite para conta terminando em {}", maskEmail(email));
            return false;
        }
    }

    private String generateTempPassword() {
        byte[] bytes = new byte[9];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String maskEmail(String email) {
        if (email == null || !email.contains("@")) {
            return "***";
        }
        return "*" + email.substring(email.indexOf('@'));
    }
}
