package com.sanoli.fitradar.repository;

import com.sanoli.fitradar.domain.CreatorSpace;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface CreatorSpaceRepository extends JpaRepository<CreatorSpace, UUID> {

    Optional<CreatorSpace> findByCreatorId(UUID creatorId);

    Optional<CreatorSpace> findBySlug(String slug);

    boolean existsBySlug(String slug);
}
