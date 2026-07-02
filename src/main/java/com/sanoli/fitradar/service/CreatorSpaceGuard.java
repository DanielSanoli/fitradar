package com.sanoli.fitradar.service;

import com.sanoli.fitradar.exception.BusinessException;
import com.sanoli.fitradar.repository.CreatorSpaceRepository;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class CreatorSpaceGuard {

    public static final String SPACE_REQUIRED_MESSAGE =
            "Crie seu espaço antes de montar programas e treinos.";

    private final CreatorSpaceRepository creatorSpaceRepository;

    public CreatorSpaceGuard(CreatorSpaceRepository creatorSpaceRepository) {
        this.creatorSpaceRepository = creatorSpaceRepository;
    }

    public void requireSpace(UUID creatorId) {
        if (creatorSpaceRepository.findByCreatorId(creatorId).isPresent()) {
            return;
        }
        throw new BusinessException(SPACE_REQUIRED_MESSAGE);
    }
}
