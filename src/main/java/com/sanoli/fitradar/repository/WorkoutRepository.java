package com.sanoli.fitradar.repository;

import com.sanoli.fitradar.domain.Workout;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WorkoutRepository extends JpaRepository<Workout, UUID> {

    List<Workout> findByProgramIdOrderByDayIndexAsc(UUID programId);

    long countByProgramId(UUID programId);

    Optional<Workout> findByIdAndProgramId(UUID id, UUID programId);
}
