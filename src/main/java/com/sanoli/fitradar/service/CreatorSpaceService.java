package com.sanoli.fitradar.service;

import com.sanoli.fitradar.domain.CreatorSpace;
import com.sanoli.fitradar.domain.SpaceCategory;
import com.sanoli.fitradar.dto.CreatorSpaceRequest;
import com.sanoli.fitradar.exception.ResourceNotFoundException;
import com.sanoli.fitradar.repository.CreatorSpaceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.Locale;
import java.util.UUID;

@Service
public class CreatorSpaceService {

    private final CreatorSpaceRepository creatorSpaceRepository;

    public CreatorSpaceService(CreatorSpaceRepository creatorSpaceRepository) {
        this.creatorSpaceRepository = creatorSpaceRepository;
    }

    @Transactional(readOnly = true)
    public CreatorSpace getByCreatorId(UUID creatorId) {
        return creatorSpaceRepository.findByCreatorId(creatorId)
                .orElseThrow(() -> new ResourceNotFoundException("Espaço ainda não criado"));
    }

    @Transactional(readOnly = true)
    public CreatorSpace getBySlug(String slug) {
        return creatorSpaceRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Espaço não encontrado: " + slug));
    }

    @Transactional
    public CreatorSpace save(UUID creatorId, CreatorSpaceRequest request) {
        CreatorSpace space = creatorSpaceRepository.findByCreatorId(creatorId).orElseGet(CreatorSpace::new);
        boolean isNew = space.getId() == null;
        if (isNew) {
            space.setCreatorId(creatorId);
        }

        space.setName(request.name().trim());
        space.setLogoUrl(request.logoUrl());
        space.setPrimaryColor(request.primaryColor());
        space.setBio(request.bio());
        space.setCategory(request.category() != null ? request.category() : SpaceCategory.OTHER);

        String desiredSlug = (request.slug() != null && !request.slug().isBlank())
                ? slugify(request.slug())
                : slugify(request.name());
        if (space.getSlug() == null || !space.getSlug().equals(desiredSlug)) {
            space.setSlug(ensureUniqueSlug(desiredSlug, space.getId()));
        }

        return creatorSpaceRepository.save(space);
    }

    private String ensureUniqueSlug(String base, UUID currentId) {
        String candidate = base.isBlank() ? "espaco" : base;
        String slug = candidate;
        int suffix = 1;
        while (slugTaken(slug, currentId)) {
            slug = candidate + "-" + suffix;
            suffix++;
        }
        return slug;
    }

    private boolean slugTaken(String slug, UUID currentId) {
        return creatorSpaceRepository.findBySlug(slug)
                .map(existing -> !existing.getId().equals(currentId))
                .orElse(false);
    }

    private String slugify(String value) {
        String normalized = Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
        return normalized.toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-+|-+$)", "");
    }
}
