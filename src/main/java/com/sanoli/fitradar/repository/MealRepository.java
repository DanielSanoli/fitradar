package com.sanoli.fitradar.repository;

import com.sanoli.fitradar.domain.Meal;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MealRepository extends JpaRepository<Meal, UUID> {

    List<Meal> findByProgramIdAndCreatorIdOrderByOrdemAsc(UUID programId, UUID creatorId);

    Optional<Meal> findByIdAndProgramIdAndCreatorId(UUID id, UUID programId, UUID creatorId);

    long countByProgramId(UUID programId);
}
