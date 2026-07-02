package com.sanoli.fitradar.repository;

import com.sanoli.fitradar.domain.Anamnese;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface AnamneseRepository extends JpaRepository<Anamnese, UUID> {

    boolean existsByStudentId(UUID studentId);

    Optional<Anamnese> findByStudentId(UUID studentId);

    Optional<Anamnese> findByStudentIdAndCreatorId(UUID studentId, UUID creatorId);
}
