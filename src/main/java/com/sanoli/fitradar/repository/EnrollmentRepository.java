package com.sanoli.fitradar.repository;

import com.sanoli.fitradar.domain.Enrollment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EnrollmentRepository extends JpaRepository<Enrollment, UUID> {

    List<Enrollment> findByStudentId(UUID studentId);

    List<Enrollment> findByStudentIdAndActiveTrue(UUID studentId);

    List<Enrollment> findByStudentIdInAndActiveTrue(Collection<UUID> studentIds);

    List<Enrollment> findByProgramId(UUID programId);

    boolean existsByStudentIdAndProgramIdAndActiveTrue(UUID studentId, UUID programId);

    Optional<Enrollment> findByIdAndStudentId(UUID id, UUID studentId);
}
