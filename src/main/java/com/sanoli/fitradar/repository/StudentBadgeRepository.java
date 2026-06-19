package com.sanoli.fitradar.repository;

import com.sanoli.fitradar.domain.StudentBadge;
import com.sanoli.fitradar.domain.BadgeType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface StudentBadgeRepository extends JpaRepository<StudentBadge, UUID> {

    List<StudentBadge> findByStudentIdOrderByEarnedAtDesc(UUID studentId);

    boolean existsByStudentIdAndBadgeType(UUID studentId, BadgeType badgeType);

    Optional<StudentBadge> findByStudentIdAndBadgeType(UUID studentId, BadgeType badgeType);
}
