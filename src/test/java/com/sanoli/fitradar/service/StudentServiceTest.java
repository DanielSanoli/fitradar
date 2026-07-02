package com.sanoli.fitradar.service;

import com.sanoli.fitradar.config.PaginationProperties;
import com.sanoli.fitradar.domain.AppUser;
import com.sanoli.fitradar.domain.UserRole;
import com.sanoli.fitradar.dto.StudentInviteRequest;
import com.sanoli.fitradar.dto.StudentInviteResponse;
import com.sanoli.fitradar.dto.StudentResendInviteResponse;
import com.sanoli.fitradar.exception.BusinessException;
import com.sanoli.fitradar.exception.ResourceNotFoundException;
import com.sanoli.fitradar.repository.EnrollmentRepository;
import com.sanoli.fitradar.repository.ProgramRepository;
import com.sanoli.fitradar.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class StudentServiceTest {

    private UserRepository userRepository;
    private EmailService emailService;
    private PasswordEncoder passwordEncoder;
    private StudentService studentService;

    private AppUser creator;
    private UUID creatorId;
    private UUID studentId;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        emailService = mock(EmailService.class);
        passwordEncoder = new BCryptPasswordEncoder();

        PaginationProperties paginationProperties = new PaginationProperties();
        paginationProperties.setDefaultSize(50);
        paginationProperties.setMaxSize(100);

        studentService = new StudentService(
                userRepository,
                mock(ProgramRepository.class),
                mock(EnrollmentRepository.class),
                passwordEncoder,
                emailService,
                paginationProperties,
                mock(PlanEntitlementService.class),
                "http://localhost:8080"
        );

        creatorId = UUID.randomUUID();
        studentId = UUID.randomUUID();
        creator = new AppUser();
        creator.setId(creatorId);
        creator.setName("Creator Test");
        creator.setEmail("creator@test.local");
        creator.setRole(UserRole.CREATOR);
    }

    @Test
    void invite_returnsEmailSentTrueWhenEmailSucceeds() {
        when(userRepository.existsByEmailIgnoreCase("aluno@test.local")).thenReturn(false);
        when(userRepository.save(any(AppUser.class))).thenAnswer(invocation -> {
            AppUser saved = invocation.getArgument(0);
            saved.setId(studentId);
            return saved;
        });

        StudentInviteResponse response = studentService.invite(
                creator, new StudentInviteRequest("Aluno", "aluno@test.local"));

        assertThat(response.emailSent()).isTrue();
        assertThat(response.temporaryPassword()).isNotBlank();
        assertThat(response.studentId()).isEqualTo(studentId);
        verify(emailService).sendStudentInvite(
                eq("aluno@test.local"),
                eq("Creator Test"),
                eq("http://localhost:8080/login"),
                eq(response.temporaryPassword()));
    }

    @Test
    void invite_stillCreatesStudentWhenEmailFails() {
        when(userRepository.existsByEmailIgnoreCase("aluno@test.local")).thenReturn(false);
        when(userRepository.save(any(AppUser.class))).thenAnswer(invocation -> {
            AppUser saved = invocation.getArgument(0);
            saved.setId(studentId);
            return saved;
        });
        doThrow(new RuntimeException("Resend down")).when(emailService)
                .sendStudentInvite(anyString(), anyString(), anyString(), anyString());

        StudentInviteResponse response = studentService.invite(
                creator, new StudentInviteRequest("Aluno", "aluno@test.local"));

        assertThat(response.emailSent()).isFalse();
        assertThat(response.temporaryPassword()).isNotBlank();
        verify(userRepository).save(any(AppUser.class));
    }

    @Test
    void resendInvite_regeneratesPasswordAndReturnsEmailStatus() {
        AppUser student = pendingStudent();
        when(userRepository.findByIdAndCreatorId(studentId, creatorId)).thenReturn(Optional.of(student));
        when(userRepository.save(any(AppUser.class))).thenAnswer(invocation -> invocation.getArgument(0));

        StudentResendInviteResponse response = studentService.resendInvite(creator, studentId);

        assertThat(response.emailSent()).isTrue();
        assertThat(response.temporaryPassword()).isNotBlank();
        assertThat(passwordEncoder.matches(response.temporaryPassword(), student.getPasswordHash())).isTrue();
        assertThat(student.isMustChangePassword()).isTrue();
    }

    @Test
    void resendInvite_blocksWhenStudentAlreadyActivated() {
        AppUser student = pendingStudent();
        student.setMustChangePassword(false);
        when(userRepository.findByIdAndCreatorId(studentId, creatorId)).thenReturn(Optional.of(student));

        assertThatThrownBy(() -> studentService.resendInvite(creator, studentId))
                .isInstanceOf(BusinessException.class)
                .hasMessage("Aluno já ativou o acesso");
    }

    @Test
    void resendInvite_enforcesTenantIsolation() {
        when(userRepository.findByIdAndCreatorId(studentId, creatorId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> studentService.resendInvite(creator, studentId))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    private AppUser pendingStudent() {
        AppUser student = new AppUser();
        student.setId(studentId);
        student.setName("Aluno");
        student.setEmail("aluno@test.local");
        student.setRole(UserRole.STUDENT);
        student.setCreatorId(creatorId);
        student.setMustChangePassword(true);
        student.setPasswordHash(passwordEncoder.encode("old-password"));
        return student;
    }
}
