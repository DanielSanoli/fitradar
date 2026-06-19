package com.sanoli.fitradar.repository;

import com.sanoli.fitradar.domain.Program;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProgramRepository extends JpaRepository<Program, UUID> {

    List<Program> findByCreatorIdOrderByCreatedAtDesc(UUID creatorId);

    List<Program> findByCreatorIdAndActiveTrue(UUID creatorId);

    Optional<Program> findByIdAndCreatorId(UUID id, UUID creatorId);
}
