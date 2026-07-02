package com.sanoli.fitradar.service;

import com.sanoli.fitradar.domain.CreatorSpace;
import com.sanoli.fitradar.domain.SpaceCategory;
import com.sanoli.fitradar.domain.SpaceModule;
import com.sanoli.fitradar.dto.CreatorSpaceRequest;
import com.sanoli.fitradar.exception.BusinessException;
import com.sanoli.fitradar.exception.ResourceNotFoundException;
import com.sanoli.fitradar.repository.CreatorSpaceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.text.Normalizer;
import java.util.EnumSet;
import java.util.LinkedHashSet;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
public class CreatorSpaceService {

    private final CreatorSpaceRepository creatorSpaceRepository;
    private final LogoStorageService logoStorageService;

    public CreatorSpaceService(
            CreatorSpaceRepository creatorSpaceRepository,
            LogoStorageService logoStorageService
    ) {
        this.creatorSpaceRepository = creatorSpaceRepository;
        this.logoStorageService = logoStorageService;
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
        space.setLogoUrl(sanitizeLogoUrl(request.logoUrl()));
        space.setPrimaryColor(request.primaryColor());
        space.setBio(request.bio());
        space.setCategory(request.category() != null ? request.category() : SpaceCategory.OTHER);
        space.setModules(resolveModules(request));

        String desiredSlug = (request.slug() != null && !request.slug().isBlank())
                ? slugify(request.slug())
                : slugify(request.name());
        if (space.getSlug() == null || !space.getSlug().equals(desiredSlug)) {
            space.setSlug(ensureUniqueSlug(desiredSlug, space.getId()));
        }

        return creatorSpaceRepository.save(space);
    }

    @Transactional
    public String uploadLogo(UUID creatorId, MultipartFile file) {
        String logoUrl = logoStorageService.store(creatorId, file);
        creatorSpaceRepository.findByCreatorId(creatorId).ifPresent(space -> {
            String previous = space.getLogoUrl();
            space.setLogoUrl(logoUrl);
            creatorSpaceRepository.save(space);
            logoStorageService.deleteIfManaged(previous);
        });
        return logoUrl;
    }

    static String sanitizeLogoUrl(String logoUrl) {
        if (logoUrl == null || logoUrl.isBlank()) {
            return null;
        }
        String trimmed = logoUrl.trim();
        if (trimmed.startsWith(LogoStorageService.PUBLIC_PREFIX) && trimmed.length() <= 500) {
            return trimmed;
        }
        if ((trimmed.startsWith("http://") || trimmed.startsWith("https://")) && trimmed.length() <= 500) {
            return trimmed;
        }
        return null;
    }

    static Set<SpaceModule> resolveModules(CreatorSpaceRequest request) {
        Set<SpaceModule> modules = new LinkedHashSet<>();
        if (request.modules() != null) {
            modules.addAll(request.modules());
        }
        if (modules.isEmpty()) {
            SpaceCategory category = request.category() != null ? request.category() : SpaceCategory.OTHER;
            modules.add(category == SpaceCategory.NUTRITION ? SpaceModule.NUTRITION : SpaceModule.TRAINING);
        }
        if (modules.isEmpty()) {
            throw new BusinessException("Selecione ao menos um módulo (Treino ou Nutrição).");
        }
        return EnumSet.copyOf(modules);
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
