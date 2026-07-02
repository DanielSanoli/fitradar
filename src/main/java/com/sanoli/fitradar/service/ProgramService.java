package com.sanoli.fitradar.service;

import com.sanoli.fitradar.domain.AppUser;
import com.sanoli.fitradar.domain.Program;
import com.sanoli.fitradar.domain.Workout;
import com.sanoli.fitradar.dto.ProgramRequest;
import com.sanoli.fitradar.dto.ProgramResponse;
import com.sanoli.fitradar.dto.WorkoutRequest;
import com.sanoli.fitradar.dto.WorkoutResponse;
import com.sanoli.fitradar.exception.ResourceNotFoundException;
import com.sanoli.fitradar.repository.ProgramRepository;
import com.sanoli.fitradar.repository.WorkoutRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ProgramService {

    private final ProgramRepository programRepository;
    private final WorkoutRepository workoutRepository;
    private final PlanEntitlementService planEntitlementService;
    private final CreatorSpaceGuard creatorSpaceGuard;

    public ProgramService(
            ProgramRepository programRepository,
            WorkoutRepository workoutRepository,
            PlanEntitlementService planEntitlementService,
            CreatorSpaceGuard creatorSpaceGuard
    ) {
        this.programRepository = programRepository;
        this.workoutRepository = workoutRepository;
        this.planEntitlementService = planEntitlementService;
        this.creatorSpaceGuard = creatorSpaceGuard;
    }

    @Transactional(readOnly = true)
    public List<ProgramResponse> listForCreator(UUID creatorId) {
        List<Program> programs = programRepository.findByCreatorIdOrderByCreatedAtDesc(creatorId);
        if (programs.isEmpty()) {
            return List.of();
        }
        List<UUID> programIds = programs.stream().map(Program::getId).toList();
        Map<UUID, Long> workoutCounts = workoutRepository.countGroupByProgramIdIn(programIds).stream()
                .collect(Collectors.toMap(row -> (UUID) row[0], row -> (Long) row[1]));
        return programs.stream()
                .map(program -> ProgramResponse.fromEntity(
                        program, workoutCounts.getOrDefault(program.getId(), 0L)))
                .toList();
    }

    @Transactional(readOnly = true)
    public ProgramResponse get(UUID creatorId, UUID programId) {
        Program program = requireProgram(creatorId, programId);
        return ProgramResponse.fromEntity(program, workoutRepository.countByProgramId(program.getId()));
    }

    @Transactional
    public ProgramResponse create(AppUser creator, ProgramRequest request) {
        creatorSpaceGuard.requireSpace(creator.getId());
        boolean active = request.active() == null || request.active();
        if (active) {
            planEntitlementService.assertCanAddActiveProgram(creator);
        }
        Program program = new Program();
        program.setCreatorId(creator.getId());
        program.setTitle(request.title().trim());
        program.setDescription(request.description());
        program.setActive(request.active() == null || request.active());
        program.setPrice(normalizePrice(request.price()));
        Program saved = programRepository.save(program);
        return ProgramResponse.fromEntity(saved, 0);
    }

    @Transactional
    public ProgramResponse update(AppUser creator, UUID programId, ProgramRequest request) {
        creatorSpaceGuard.requireSpace(creator.getId());
        Program program = requireProgram(creator.getId(), programId);
        program.setTitle(request.title().trim());
        program.setDescription(request.description());
        if (request.active() != null) {
            if (request.active() && !program.isActive()) {
                planEntitlementService.assertCanAddActiveProgram(creator);
            }
            program.setActive(request.active());
        }
        if (request.price() != null) {
            program.setPrice(normalizePrice(request.price()));
        }
        Program saved = programRepository.save(program);
        return ProgramResponse.fromEntity(saved, workoutRepository.countByProgramId(saved.getId()));
    }

    @Transactional
    public void delete(UUID creatorId, UUID programId) {
        Program program = requireProgram(creatorId, programId);
        workoutRepository.findByProgramIdOrderByDayIndexAsc(program.getId())
                .forEach(workout -> workoutRepository.deleteById(workout.getId()));
        programRepository.delete(program);
    }

    @Transactional(readOnly = true)
    public List<WorkoutResponse> listWorkouts(UUID creatorId, UUID programId) {
        requireProgram(creatorId, programId);
        return workoutRepository.findByProgramIdOrderByDayIndexAsc(programId).stream()
                .map(WorkoutResponse::fromEntity)
                .toList();
    }

    @Transactional
    public WorkoutResponse addWorkout(UUID creatorId, UUID programId, WorkoutRequest request) {
        creatorSpaceGuard.requireSpace(creatorId);
        creatorSpaceGuard.requireWorkoutWrite(creatorId);
        requireProgram(creatorId, programId);
        Workout workout = new Workout();
        workout.setProgramId(programId);
        workout.setTitle(request.title().trim());
        workout.setDescription(request.description());
        workout.setContentMarkdown(request.contentMarkdown());
        workout.setDayIndex(request.dayIndex());
        return WorkoutResponse.fromEntity(workoutRepository.save(workout));
    }

    @Transactional
    public WorkoutResponse updateWorkout(UUID creatorId, UUID programId, UUID workoutId, WorkoutRequest request) {
        creatorSpaceGuard.requireSpace(creatorId);
        creatorSpaceGuard.requireWorkoutWrite(creatorId);
        requireProgram(creatorId, programId);
        Workout workout = workoutRepository.findByIdAndProgramId(workoutId, programId)
                .orElseThrow(() -> new ResourceNotFoundException("Treino não encontrado: " + workoutId));
        workout.setTitle(request.title().trim());
        workout.setDescription(request.description());
        workout.setContentMarkdown(request.contentMarkdown());
        workout.setDayIndex(request.dayIndex());
        return WorkoutResponse.fromEntity(workoutRepository.save(workout));
    }

    @Transactional
    public void deleteWorkout(UUID creatorId, UUID programId, UUID workoutId) {
        requireProgram(creatorId, programId);
        Workout workout = workoutRepository.findByIdAndProgramId(workoutId, programId)
                .orElseThrow(() -> new ResourceNotFoundException("Treino não encontrado: " + workoutId));
        workoutRepository.delete(workout);
    }

    private Program requireProgram(UUID creatorId, UUID programId) {
        return programRepository.findByIdAndCreatorId(programId, creatorId)
                .orElseThrow(() -> new ResourceNotFoundException("Programa não encontrado: " + programId));
    }

    private java.math.BigDecimal normalizePrice(java.math.BigDecimal price) {
        if (price == null || price.signum() <= 0) {
            return null;
        }
        return price.setScale(2, java.math.RoundingMode.HALF_EVEN);
    }
}
