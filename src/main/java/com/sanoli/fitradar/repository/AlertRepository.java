package com.sanoli.fitradar.repository;

import com.sanoli.fitradar.domain.Alert;
import com.sanoli.fitradar.domain.AlertType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AlertRepository extends JpaRepository<Alert, UUID> {

    List<Alert> findByRecipientUserIdOrderByCreatedAtDesc(UUID recipientUserId);

    Page<Alert> findByRecipientUserIdOrderByCreatedAtDesc(UUID recipientUserId, Pageable pageable);

    List<Alert> findByRecipientUserIdAndReadFalseOrderByCreatedAtDesc(UUID recipientUserId);

    Page<Alert> findByRecipientUserIdAndReadFalseOrderByCreatedAtDesc(UUID recipientUserId, Pageable pageable);

    Optional<Alert> findByIdAndRecipientUserId(UUID id, UUID recipientUserId);

    boolean existsByRecipientUserIdAndSubjectStudentIdAndTypeAndCreatedAtAfter(
            UUID recipientUserId, UUID subjectStudentId, AlertType type, Instant after);
}
