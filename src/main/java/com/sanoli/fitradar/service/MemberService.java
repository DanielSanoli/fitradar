package com.sanoli.fitradar.service;

import com.sanoli.fitradar.domain.AppUser;
import com.sanoli.fitradar.domain.CheckIn;
import com.sanoli.fitradar.domain.CheckInStatus;
import com.sanoli.fitradar.domain.CreatorSpace;
import com.sanoli.fitradar.domain.Enrollment;
import com.sanoli.fitradar.domain.Program;
import com.sanoli.fitradar.domain.Workout;
import com.sanoli.fitradar.config.PaginationProperties;
import com.sanoli.fitradar.dto.CheckInRequest;
import com.sanoli.fitradar.dto.CheckInResponse;
import com.sanoli.fitradar.dto.CreatorSpaceResponse;
import com.sanoli.fitradar.dto.PageResponse;
import com.sanoli.fitradar.dto.WorkoutResponse;
import com.sanoli.fitradar.exception.BusinessException;
import com.sanoli.fitradar.exception.ForbiddenException;
import com.sanoli.fitradar.exception.ResourceNotFoundException;
import com.sanoli.fitradar.repository.CheckInRepository;
import com.sanoli.fitradar.repository.CreatorSpaceRepository;
import com.sanoli.fitradar.repository.EnrollmentRepository;
import com.sanoli.fitradar.repository.ProgramRepository;
import com.sanoli.fitradar.repository.WorkoutRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Operações do próprio aluno (escopo /api/v1/my). Só enxerga conteúdo do seu criador.
 */
@Service
public class MemberService {

    private final EnrollmentRepository enrollmentRepository;
    private final ProgramRepository programRepository;
    private final WorkoutRepository workoutRepository;
    private final CheckInRepository checkInRepository;
    private final CreatorSpaceRepository creatorSpaceRepository;
    private final GamificationService gamificationService;
    private final PaginationProperties paginationProperties;

    public MemberService(
            EnrollmentRepository enrollmentRepository,
            ProgramRepository programRepository,
            WorkoutRepository workoutRepository,
            CheckInRepository checkInRepository,
            CreatorSpaceRepository creatorSpaceRepository,
            GamificationService gamificationService,
            PaginationProperties paginationProperties
    ) {
        this.enrollmentRepository = enrollmentRepository;
        this.programRepository = programRepository;
        this.workoutRepository = workoutRepository;
        this.checkInRepository = checkInRepository;
        this.creatorSpaceRepository = creatorSpaceRepository;
        this.gamificationService = gamificationService;
        this.paginationProperties = paginationProperties;
    }

    @Transactional(readOnly = true)
    public Optional<CreatorSpaceResponse> getMySpace(AppUser student) {
        if (student.getCreatorId() == null) {
            return Optional.empty();
        }
        return creatorSpaceRepository.findByCreatorId(student.getCreatorId())
                .map(CreatorSpaceResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public List<WorkoutResponse> getMyWorkouts(AppUser student) {
        List<Enrollment> enrollments = enrollmentRepository.findByStudentIdAndActiveTrue(student.getId());
        if (enrollments.isEmpty()) {
            return List.of();
        }
        var programIds = enrollments.stream().map(Enrollment::getProgramId).distinct().toList();
        return workoutRepository.findByProgramIdInOrderByProgramIdAscDayIndexAsc(programIds).stream()
                .map(WorkoutResponse::fromEntity)
                .toList();
    }

    @Transactional
    public CheckInResponse checkIn(AppUser student, CheckInRequest request) {
        Workout workout = workoutRepository.findById(request.workoutId())
                .orElseThrow(() -> new ResourceNotFoundException("Treino não encontrado: " + request.workoutId()));

        Program program = programRepository.findById(workout.getProgramId())
                .orElseThrow(() -> new ResourceNotFoundException("Programa não encontrado"));

        // Isolamento multi-tenant: o treino precisa pertencer ao criador do aluno.
        if (student.getCreatorId() == null || !program.getCreatorId().equals(student.getCreatorId())) {
            throw new ForbiddenException("Treino não pertence ao seu criador");
        }

        if (!enrollmentRepository.existsByStudentIdAndProgramIdAndActiveTrue(student.getId(), program.getId())) {
            throw new BusinessException("Você não está matriculado no programa deste treino");
        }

        LocalDate date = request.date() != null ? request.date() : LocalDate.now();
        if (checkInRepository.existsByWorkoutIdAndStudentIdAndDate(workout.getId(), student.getId(), date)) {
            throw new BusinessException("Você já registrou este treino nesta data");
        }

        CheckIn checkIn = new CheckIn();
        checkIn.setStudentId(student.getId());
        checkIn.setWorkoutId(workout.getId());
        checkIn.setDate(date);
        checkIn.setStatus(Boolean.TRUE.equals(request.skipped()) ? CheckInStatus.SKIPPED : CheckInStatus.DONE);
        checkIn.setFeeling(request.feeling());
        checkIn.setNotes(request.notes());
        CheckIn saved = checkInRepository.save(checkIn);
        if (saved.getStatus() == CheckInStatus.DONE) {
            var outcome = gamificationService.recordCheckIn(student, saved.getDate(), saved.getStatus());
            return CheckInResponse.fromCheckIn(saved, outcome);
        }
        return CheckInResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public PageResponse<CheckInResponse> listMyCheckIns(AppUser student, Integer page, Integer size) {
        Page<CheckIn> checkIns = checkInRepository.findByStudentIdOrderByDateDesc(
                student.getId(),
                paginationProperties.toPageable(page, size, Sort.by(Sort.Direction.DESC, "date")));
        return PageResponse.from(checkIns.map(CheckInResponse::fromEntity));
    }
}
