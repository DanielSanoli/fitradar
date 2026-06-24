package com.sanoli.fitradar.dto;

import com.sanoli.fitradar.domain.CreatorSpace;
import com.sanoli.fitradar.domain.SpaceCategory;

import java.time.Instant;
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
                space.getCreatedAt()
        );
    }
}
