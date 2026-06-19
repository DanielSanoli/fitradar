package com.sanoli.fitradar.repository;

import com.sanoli.fitradar.domain.Workout;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WorkoutRepository extends JpaRepository<Workout, UUID> {

    List<Workout> findByProgramIdOrderByDayIndexAsc(UUID programId);

    List<Workout> findByProgramIdInOrderByProgramIdAscDayIndexAsc(Collection<UUID> programIds);

    @Query("SELECT w.programId, COUNT(w) FROM Workout w WHERE w.programId IN :programIds GROUP BY w.programId")
    List<Object[]> countGroupByProgramIdIn(@Param("programIds") Collection<UUID> programIds);

    long countByProgramId(UUID programId);

    Optional<Workout> findByIdAndProgramId(UUID id, UUID programId);
}
