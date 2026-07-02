package com.sanoli.fitradar.service;

import com.sanoli.fitradar.domain.CreatorSpace;
import com.sanoli.fitradar.domain.SpaceModule;
import com.sanoli.fitradar.exception.BusinessException;
import com.sanoli.fitradar.repository.CreatorSpaceRepository;
import org.springframework.stereotype.Service;

import java.util.EnumSet;
import java.util.Set;
import java.util.UUID;

@Service
public class CreatorSpaceGuard {

    public static final String SPACE_REQUIRED_MESSAGE =
            "Crie seu espaço antes de montar programas e treinos.";

    public static final String TRAINING_MODULE_REQUIRED_MESSAGE =
            "Ative o módulo Treino no seu espaço.";

    public static final String NUTRITION_MODULE_REQUIRED_MESSAGE =
            "Ative o módulo Nutrição no seu espaço.";

    private final CreatorSpaceRepository creatorSpaceRepository;

    public CreatorSpaceGuard(CreatorSpaceRepository creatorSpaceRepository) {
        this.creatorSpaceRepository = creatorSpaceRepository;
    }

    public void requireSpace(UUID creatorId) {
        requireExistingSpace(creatorId);
    }

    public void requireTrainingModule(UUID creatorId) {
        requireModule(creatorId, SpaceModule.TRAINING, TRAINING_MODULE_REQUIRED_MESSAGE);
    }

    /**
     * Treinos (Workout) exigem TRAINING, exceto espaço só Nutrição — aí Workout ainda representa
     * refeições em markdown (legado).
     */
    public void requireWorkoutWrite(UUID creatorId) {
        CreatorSpace space = requireExistingSpace(creatorId);
        Set<SpaceModule> modules = space.getModules();
        if (modules.contains(SpaceModule.TRAINING)) {
            return;
        }
        if (modules.equals(EnumSet.of(SpaceModule.NUTRITION))) {
            return;
        }
        throw new BusinessException(TRAINING_MODULE_REQUIRED_MESSAGE);
    }

    public void requireNutritionModule(UUID creatorId) {
        requireModule(creatorId, SpaceModule.NUTRITION, NUTRITION_MODULE_REQUIRED_MESSAGE);
    }

    private CreatorSpace requireExistingSpace(UUID creatorId) {
        return creatorSpaceRepository.findByCreatorId(creatorId)
                .orElseThrow(() -> new BusinessException(SPACE_REQUIRED_MESSAGE));
    }

    private void requireModule(UUID creatorId, SpaceModule module, String message) {
        CreatorSpace space = requireExistingSpace(creatorId);
        if (space.getModules() == null || !space.getModules().contains(module)) {
            throw new BusinessException(message);
        }
    }
}
