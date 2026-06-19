package com.sanoli.fitradar.service;

import com.sanoli.fitradar.config.AppRuntimeProperties;
import com.sanoli.fitradar.domain.AppUser;
import com.sanoli.fitradar.domain.Program;
import com.sanoli.fitradar.domain.UserRole;
import com.sanoli.fitradar.domain.Workout;
import com.sanoli.fitradar.dto.OnboardingStatusResponse;
import com.sanoli.fitradar.exception.BusinessException;
import com.sanoli.fitradar.repository.CreatorSpaceRepository;
import com.sanoli.fitradar.repository.ProgramRepository;
import com.sanoli.fitradar.repository.UserRepository;
import com.sanoli.fitradar.repository.WorkoutRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class OnboardingService {

    private final CreatorSpaceRepository creatorSpaceRepository;
    private final ProgramRepository programRepository;
    private final UserRepository userRepository;
    private final WorkoutRepository workoutRepository;
    private final AppRuntimeProperties runtimeProperties;

    public OnboardingService(
            CreatorSpaceRepository creatorSpaceRepository,
            ProgramRepository programRepository,
            UserRepository userRepository,
            WorkoutRepository workoutRepository,
            AppRuntimeProperties runtimeProperties
    ) {
        this.creatorSpaceRepository = creatorSpaceRepository;
        this.programRepository = programRepository;
        this.userRepository = userRepository;
        this.workoutRepository = workoutRepository;
        this.runtimeProperties = runtimeProperties;
    }

    @Transactional(readOnly = true)
    public OnboardingStatusResponse status(UUID creatorId) {
        boolean hasSpace = creatorSpaceRepository.findByCreatorId(creatorId).isPresent();
        boolean hasProgram = !programRepository.findByCreatorIdOrderByCreatedAtDesc(creatorId).isEmpty();
        boolean hasStudent = !userRepository.findByCreatorIdAndRole(creatorId, UserRole.STUDENT).isEmpty();
        boolean demoAvailable = runtimeProperties.isDemoSeedEnabled() && !hasProgram;
        boolean complete = hasSpace && hasProgram && hasStudent;
        return new OnboardingStatusResponse(hasSpace, hasProgram, hasStudent, demoAvailable, complete);
    }

    @Transactional
    public OnboardingStatusResponse seedDemo(AppUser creator) {
        if (!runtimeProperties.isDemoSeedEnabled()) {
            throw new BusinessException("Seed demo desabilitado neste ambiente");
        }
        UUID creatorId = creator.getId();
        if (!programRepository.findByCreatorIdOrderByCreatedAtDesc(creatorId).isEmpty()) {
            throw new BusinessException("Você já possui programas — o demo não é necessário");
        }

        Program program = new Program();
        program.setCreatorId(creatorId);
        program.setTitle("Programa inicial (demo)");
        program.setDescription("Exemplo de programa semanal para você explorar o FitRadar.");
        program.setActive(true);
        Program saved = programRepository.save(program);

        createWorkout(saved.getId(), "Treino A — Full body", 0);
        createWorkout(saved.getId(), "Treino B — Inferiores", 1);
        createWorkout(saved.getId(), "Treino C — Superiores", 2);

        return status(creatorId);
    }

    private void createWorkout(UUID programId, String title, int dayIndex) {
        Workout workout = new Workout();
        workout.setProgramId(programId);
        workout.setTitle(title);
        workout.setDayIndex(dayIndex);
        workout.setContentMarkdown("## " + title + "\n\nConfigure os exercícios aqui.");
        workoutRepository.save(workout);
    }
}
