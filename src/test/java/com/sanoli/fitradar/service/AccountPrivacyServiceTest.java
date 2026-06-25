package com.sanoli.fitradar.service;

import com.sanoli.fitradar.domain.AppUser;
import com.sanoli.fitradar.domain.CheckIn;
import com.sanoli.fitradar.domain.Enrollment;
import com.sanoli.fitradar.domain.UserRole;
import com.sanoli.fitradar.dto.AccountDataExportResponse;
import com.sanoli.fitradar.dto.DeleteAccountRequest;
import com.sanoli.fitradar.exception.BusinessException;
import com.sanoli.fitradar.repository.AlertRepository;
import com.sanoli.fitradar.repository.CheckInRepository;
import com.sanoli.fitradar.repository.CreatorSpaceRepository;
import com.sanoli.fitradar.repository.EnrollmentRepository;
import com.sanoli.fitradar.repository.ProgramRepository;
import com.sanoli.fitradar.repository.PushSubscriptionRepository;
import com.sanoli.fitradar.repository.RefreshTokenRepository;
import com.sanoli.fitradar.repository.StudentBadgeRepository;
import com.sanoli.fitradar.repository.StudentGamificationProfileRepository;
import com.sanoli.fitradar.repository.UserActionTokenRepository;
import com.sanoli.fitradar.repository.UserRepository;
import com.sanoli.fitradar.repository.UserSettingsRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AccountPrivacyServiceTest {

    private UserRepository userRepository;
    private CheckInRepository checkInRepository;
    private EnrollmentRepository enrollmentRepository;
    private AccountPrivacyService service;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        checkInRepository = mock(CheckInRepository.class);
        enrollmentRepository = mock(EnrollmentRepository.class);
        service = new AccountPrivacyService(
                userRepository,
                mock(UserSettingsRepository.class),
                checkInRepository,
                enrollmentRepository,
                mock(StudentBadgeRepository.class),
                mock(StudentGamificationProfileRepository.class),
                mock(AlertRepository.class),
                mock(CreatorSpaceRepository.class),
                mock(ProgramRepository.class),
                mock(PushSubscriptionRepository.class),
                mock(RefreshTokenRepository.class),
                mock(UserActionTokenRepository.class),
                new BCryptPasswordEncoder()
        );
    }

    @Test
    void exportData_studentIncludesCheckInsAndEnrollments() {
        AppUser student = student("aluno@test.local");
        CheckIn checkIn = new CheckIn();
        checkIn.setId(UUID.randomUUID());
        checkIn.setStudentId(student.getId());
        checkIn.setWorkoutId(UUID.randomUUID());
        checkIn.setDate(LocalDate.now());
        Enrollment enrollment = new Enrollment();
        enrollment.setId(UUID.randomUUID());
        enrollment.setStudentId(student.getId());
        enrollment.setProgramId(UUID.randomUUID());

        when(checkInRepository.findByStudentIdOrderByDateDesc(student.getId())).thenReturn(List.of(checkIn));
        when(enrollmentRepository.findByStudentId(student.getId())).thenReturn(List.of(enrollment));

        AccountDataExportResponse export = service.exportData(student);

        assertThat(export.account().get("email")).isEqualTo("aluno@test.local");
        assertThat(export.checkIns()).hasSize(1);
        assertThat(export.enrollments()).hasSize(1);
    }

    @Test
    void deleteAccount_studentPurgesData() {
        AppUser student = student("aluno@test.local");
        when(checkInRepository.findByStudentIdOrderByDateDesc(student.getId())).thenReturn(List.of());
        when(enrollmentRepository.findByStudentId(student.getId())).thenReturn(List.of());

        service.deleteAccount(student, new DeleteAccountRequest("aluno@test.local"));

        verify(userRepository).delete(student);
    }

    @Test
    void deleteAccount_creatorWithStudentsIsBlocked() {
        AppUser creator = creator("creator@test.local");
        when(userRepository.countByCreatorIdAndRole(creator.getId(), UserRole.STUDENT)).thenReturn(2L);

        assertThatThrownBy(() -> service.deleteAccount(creator, new DeleteAccountRequest("creator@test.local")))
                .isInstanceOf(BusinessException.class);

        verify(userRepository, never()).delete(any());
        verify(userRepository, never()).save(any());
    }

    @Test
    void deleteAccount_rejectsWrongConfirmationEmail() {
        AppUser student = student("aluno@test.local");

        assertThatThrownBy(() -> service.deleteAccount(student, new DeleteAccountRequest("outro@test.local")))
                .isInstanceOf(BusinessException.class);
    }

    private AppUser student(String email) {
        AppUser user = new AppUser();
        user.setId(UUID.randomUUID());
        user.setName("Aluno");
        user.setEmail(email);
        user.setPasswordHash("hash");
        user.setRole(UserRole.STUDENT);
        user.setCreatorId(UUID.randomUUID());
        return user;
    }

    private AppUser creator(String email) {
        AppUser user = new AppUser();
        user.setId(UUID.randomUUID());
        user.setName("Creator");
        user.setEmail(email);
        user.setPasswordHash("hash");
        user.setRole(UserRole.CREATOR);
        return user;
    }
}
