package com.sanoli.fitradar.repository;

import com.sanoli.fitradar.domain.CheckIn;
import com.sanoli.fitradar.domain.CheckInStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CheckInRepository extends JpaRepository<CheckIn, UUID> {

    Page<CheckIn> findByStudentIdOrderByDateDesc(UUID studentId, Pageable pageable);

    List<CheckIn> findByStudentIdOrderByDateDesc(UUID studentId);

    List<CheckIn> findByStudentIdAndDateBetween(UUID studentId, LocalDate from, LocalDate to);

    List<CheckIn> findByStudentIdAndStatusAndDateBetween(
            UUID studentId, CheckInStatus status, LocalDate from, LocalDate to);

    long countByStudentIdAndStatusAndDateBetween(
            UUID studentId, CheckInStatus status, LocalDate from, LocalDate to);

    @Query("select max(c.date) from CheckIn c where c.studentId = :studentId")
    Optional<LocalDate> findMaxDateByStudentId(@Param("studentId") UUID studentId);

    boolean existsByWorkoutIdAndStudentIdAndDate(UUID workoutId, UUID studentId, LocalDate date);

    @Query("SELECT c.studentId, MAX(c.date) FROM CheckIn c WHERE c.studentId IN :studentIds GROUP BY c.studentId")
    List<Object[]> findMaxDateByStudentIdIn(@Param("studentIds") Collection<UUID> studentIds);

    List<CheckIn> findByStudentIdInAndStatusAndDateBetween(
            Collection<UUID> studentIds, CheckInStatus status, LocalDate from, LocalDate to);
}
