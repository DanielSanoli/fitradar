package com.sanoli.fitradar.service;

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
import java.util.UUID;

@Service
public class ProgramService {

    private final ProgramRepository programRepository;
    private final WorkoutRepository workoutRepository;

    public ProgramService(ProgramRepository programRepository, WorkoutRepository workoutRepository) {
        this.programRepository = programRepository;
        this.workoutRepository = workoutRepository;
    }

    @Transactional(readOnly = true)
    public List<ProgramResponse> listForCreator(UUID creatorId) {
        return programRepository.findByCreatorIdOrderByCreatedAtDesc(creatorId).stream()
                .map(program -> ProgramResponse.fromEntity(program, workoutRepository.countByProgramId(program.getId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public ProgramResponse get(UUID creatorId, UUID programId) {
        Program program = requireProgram(creatorId, programId);
        return ProgramResponse.fromEntity(program, workoutRepository.countByProgramId(program.getId()));
    }

    @Transactional
    public ProgramResponse create(UUID creatorId, ProgramRequest request) {
        Program program = new Program();
        program.setCreatorId(creatorId);
        program.setTitle(request.title().trim());
        program.setDescription(request.description());
        program.setActive(request.active() == null || request.active());
        program.setPrice(normalizePrice(request.price()));
        Program saved = programRepository.save(program);
        return ProgramResponse.fromEntity(saved, 0);
    }

    @Transactional
    public ProgramResponse update(UUID creatorId, UUID programId, ProgramRequest request) {
        Program program = requireProgram(creatorId, programId);
        program.setTitle(request.title().trim());
        program.setDescription(request.description());
        if (request.active() != null) {
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
