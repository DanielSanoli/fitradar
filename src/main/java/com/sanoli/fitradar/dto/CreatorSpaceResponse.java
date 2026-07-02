package com.sanoli.fitradar.dto;

import com.sanoli.fitradar.domain.CreatorSpace;
import com.sanoli.fitradar.domain.SpaceCategory;
import com.sanoli.fitradar.domain.SpaceModule;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record CreatorSpaceResponse(
        UUID id,
        UUID creatorId,
        String name,
        String slug,
        String logoUrl,
        String primaryColor,
        String bio,
        SpaceCategory category,
        List<SpaceModule> modules,
        Instant createdAt
) {
    public static CreatorSpaceResponse fromEntity(CreatorSpace space) {
        return new CreatorSpaceResponse(
                space.getId(),
                space.getCreatorId(),
                space.getName(),
                space.getSlug(),
                space.getLogoUrl(),
                space.getPrimaryColor(),
                space.getBio(),
                space.getCategory() != null ? space.getCategory() : SpaceCategory.OTHER,
                space.getModules().stream().sorted().toList(),
                space.getCreatedAt()
        );
    }
}
