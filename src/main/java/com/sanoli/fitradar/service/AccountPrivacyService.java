package com.sanoli.fitradar.service;

import com.sanoli.fitradar.domain.Alert;
import com.sanoli.fitradar.domain.AppUser;
import com.sanoli.fitradar.domain.CheckIn;
import com.sanoli.fitradar.domain.CreatorSpace;
import com.sanoli.fitradar.domain.Enrollment;
import com.sanoli.fitradar.domain.Program;
import com.sanoli.fitradar.domain.StudentBadge;
import com.sanoli.fitradar.domain.StudentGamificationProfile;
import com.sanoli.fitradar.domain.UserRole;
import com.sanoli.fitradar.domain.UserSettings;
import com.sanoli.fitradar.dto.AccountDataExportResponse;
import com.sanoli.fitradar.dto.DeleteAccountRequest;
import com.sanoli.fitradar.exception.BusinessException;
import com.sanoli.fitradar.legal.LegalConstants;
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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class AccountPrivacyService {

    private static final Logger log = LoggerFactory.getLogger(AccountPrivacyService.class);

    private final UserRepository userRepository;
    private final UserSettingsRepository userSettingsRepository;
    private final CheckInRepository checkInRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final StudentBadgeRepository studentBadgeRepository;
    private final StudentGamificationProfileRepository gamificationProfileRepository;
    private final AlertRepository alertRepository;
    private final CreatorSpaceRepository creatorSpaceRepository;
    private final ProgramRepository programRepository;
    private final PushSubscriptionRepository pushSubscriptionRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final UserActionTokenRepository userActionTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final ProgressPhotoService progressPhotoService;

    public AccountPrivacyService(
            UserRepository userRepository,
            UserSettingsRepository userSettingsRepository,
            CheckInRepository checkInRepository,
            EnrollmentRepository enrollmentRepository,
            StudentBadgeRepository studentBadgeRepository,
            StudentGamificationProfileRepository gamificationProfileRepository,
            AlertRepository alertRepository,
            CreatorSpaceRepository creatorSpaceRepository,
            ProgramRepository programRepository,
            PushSubscriptionRepository pushSubscriptionRepository,
            RefreshTokenRepository refreshTokenRepository,
            UserActionTokenRepository userActionTokenRepository,
            PasswordEncoder passwordEncoder,
            ProgressPhotoService progressPhotoService
    ) {
        this.userRepository = userRepository;
        this.userSettingsRepository = userSettingsRepository;
        this.checkInRepository = checkInRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.studentBadgeRepository = studentBadgeRepository;
        this.gamificationProfileRepository = gamificationProfileRepository;
        this.alertRepository = alertRepository;
        this.creatorSpaceRepository = creatorSpaceRepository;
        this.programRepository = programRepository;
        this.pushSubscriptionRepository = pushSubscriptionRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.userActionTokenRepository = userActionTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.progressPhotoService = progressPhotoService;
    }

    @Transactional(readOnly = true)
    public AccountDataExportResponse exportData(AppUser user) {
        Map<String, Object> account = accountMap(user);
        Map<String, Object> settings = userSettingsRepository.findById(user.getId())
                .map(this::settingsMap)
                .orElse(Map.of());

        List<Map<String, Object>> checkIns = List.of();
        List<Map<String, Object>> enrollments = List.of();
        List<Map<String, Object>> badges = List.of();
        Map<String, Object> gamification = Map.of();
        List<Map<String, Object>> alerts = List.of();
        Map<String, Object> creatorSpace = Map.of();
        List<Map<String, Object>> programs = List.of();

        if (user.isStudent()) {
            UUID studentId = user.getId();
            checkIns = checkInRepository.findByStudentIdOrderByDateDesc(studentId).stream()
                    .map(this::checkInMap)
                    .toList();
            enrollments = enrollmentRepository.findByStudentId(studentId).stream()
                    .map(this::enrollmentMap)
                    .toList();
            badges = studentBadgeRepository.findByStudentIdOrderByEarnedAtDesc(studentId).stream()
                    .map(this::badgeMap)
                    .toList();
            gamification = gamificationProfileRepository.findById(studentId)
                    .map(this::gamificationMap)
                    .orElse(Map.of());
        }

        if (user.isCreator()) {
            alerts = alertRepository.findByRecipientUserIdOrderByCreatedAtDesc(user.getId()).stream()
                    .map(this::alertMap)
                    .toList();
            creatorSpace = creatorSpaceRepository.findByCreatorId(user.getId())
                    .map(this::creatorSpaceMap)
                    .orElse(Map.of());
            programs = programRepository.findByCreatorIdOrderByCreatedAtDesc(user.getId()).stream()
                    .map(this::programMap)
                    .toList();
        }

        return new AccountDataExportResponse(
                Instant.now(),
                user.getTermsVersion(),
                account,
                settings,
                checkIns,
                enrollments,
                badges,
                gamification,
                alerts,
                creatorSpace,
                programs
        );
    }

    @Transactional
    public void deleteAccount(AppUser user, DeleteAccountRequest request) {
        String confirmEmail = request.confirmEmail().trim().toLowerCase();
        if (!confirmEmail.equalsIgnoreCase(user.getEmail())) {
            throw new BusinessException("E-mail de confirmação não confere");
        }

        if (user.isCreator()) {
            long studentCount = userRepository.countByCreatorIdAndRole(user.getId(), UserRole.STUDENT);
            if (studentCount > 0) {
                throw new BusinessException(
                        "Sua conta possui alunos vinculados. Entre em contato com o suporte para exclusão da comunidade."
                );
            }
            anonymizeCreator(user);
        } else {
            purgeStudent(user);
        }

        log.info("[privacy:delete] userId={} role={}", user.getId(), user.getRole());
    }

    private void purgeStudent(AppUser user) {
        UUID studentId = user.getId();
        progressPhotoService.purgeStudentData(studentId);
        checkInRepository.deleteAll(checkInRepository.findByStudentIdOrderByDateDesc(studentId));
        enrollmentRepository.deleteAll(enrollmentRepository.findByStudentId(studentId));
        studentBadgeRepository.deleteAll(studentBadgeRepository.findByStudentIdOrderByEarnedAtDesc(studentId));
        gamificationProfileRepository.findById(studentId).ifPresent(gamificationProfileRepository::delete);
        clearSharedUserData(user);
        userRepository.delete(user);
    }

    private void anonymizeCreator(AppUser user) {
        programRepository.findByCreatorIdOrderByCreatedAtDesc(user.getId()).forEach(program -> {
            program.setActive(false);
            programRepository.save(program);
        });
        user.setName("Conta excluída");
        user.setEmail("deleted-" + user.getId() + "@fitradar.invalid");
        user.setPasswordHash(passwordEncoder.encode(UUID.randomUUID().toString()));
        user.setAsaasCustomerId(null);
        user.setAsaasSubscriptionId(null);
        user.setAsaasWalletId(null);
        user.setEmailVerified(false);
        clearSharedUserData(user);
        userRepository.save(user);
    }

    private void clearSharedUserData(AppUser user) {
        pushSubscriptionRepository.deleteByUserId(user.getId());
        userSettingsRepository.findById(user.getId()).ifPresent(userSettingsRepository::delete);
        refreshTokenRepository.deleteByUser_Id(user.getId());
        userActionTokenRepository.deleteByUser_Id(user.getId());
    }

    private Map<String, Object> accountMap(AppUser user) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", user.getId());
        map.put("name", user.getName());
        map.put("email", user.getEmail());
        map.put("role", user.getRole());
        map.put("creatorId", user.getCreatorId());
        map.put("plan", user.getPlan());
        map.put("subscriptionStatus", user.getSubscriptionStatus());
        map.put("emailVerified", user.isEmailVerified());
        map.put("termsAcceptedAt", user.getTermsAcceptedAt());
        map.put("termsVersion", user.getTermsVersion());
        map.put("createdAt", user.getCreatedAt());
        map.put("updatedAt", user.getUpdatedAt());
        return map;
    }

    private Map<String, Object> settingsMap(UserSettings settings) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("digestFrequency", settings.getDigestFrequency());
        map.put("updatedAt", settings.getUpdatedAt());
        return map;
    }

    private Map<String, Object> checkInMap(CheckIn checkIn) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", checkIn.getId());
        map.put("workoutId", checkIn.getWorkoutId());
        map.put("date", checkIn.getDate());
        map.put("status", checkIn.getStatus());
        map.put("feeling", checkIn.getFeeling());
        map.put("notes", checkIn.getNotes());
        map.put("createdAt", checkIn.getCreatedAt());
        return map;
    }

    private Map<String, Object> enrollmentMap(Enrollment enrollment) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", enrollment.getId());
        map.put("programId", enrollment.getProgramId());
        map.put("startDate", enrollment.getStartDate());
        map.put("active", enrollment.isActive());
        map.put("createdAt", enrollment.getCreatedAt());
        return map;
    }

    private Map<String, Object> badgeMap(StudentBadge badge) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("badgeType", badge.getBadgeType());
        map.put("earnedAt", badge.getEarnedAt());
        return map;
    }

    private Map<String, Object> gamificationMap(StudentGamificationProfile profile) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("currentStreak", profile.getCurrentStreak());
        map.put("longestStreak", profile.getLongestStreak());
        map.put("totalCheckInsDone", profile.getTotalCheckInsDone());
        map.put("lastActivityDate", profile.getLastActivityDate());
        map.put("streakShields", profile.getStreakShields());
        map.put("shieldEarnProgress", profile.getShieldEarnProgress());
        return map;
    }

    private Map<String, Object> alertMap(Alert alert) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", alert.getId());
        map.put("type", alert.getType());
        map.put("severity", alert.getSeverity());
        map.put("message", alert.getMessage());
        map.put("read", alert.isRead());
        map.put("createdAt", alert.getCreatedAt());
        return map;
    }

    private Map<String, Object> creatorSpaceMap(CreatorSpace space) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("slug", space.getSlug());
        map.put("name", space.getName());
        map.put("category", space.getCategory());
        map.put("modules", space.getModules().stream().sorted().map(Enum::name).toList());
        map.put("primaryColor", space.getPrimaryColor());
        map.put("bio", space.getBio());
        return map;
    }

    private Map<String, Object> programMap(Program program) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", program.getId());
        map.put("title", program.getTitle());
        map.put("description", program.getDescription());
        map.put("active", program.isActive());
        map.put("price", program.getPrice());
        map.put("createdAt", program.getCreatedAt());
        return map;
    }
}
