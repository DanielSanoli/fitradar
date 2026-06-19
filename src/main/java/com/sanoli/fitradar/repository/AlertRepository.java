package com.sanoli.fitradar.repository;

import com.sanoli.fitradar.domain.Alert;
import com.sanoli.fitradar.domain.AlertType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AlertRepository extends JpaRepository<Alert, UUID> {

    List<Alert> findByRecipientUserIdOrderByCreatedAtDesc(UUID recipientUserId);

    List<Alert> findByRecipientUserIdAndReadFalseOrderByCreatedAtDesc(UUID recipientUserId);

    Optional<Alert> findByIdAndRecipientUserId(UUID id, UUID recipientUserId);

    boolean existsByRecipientUserIdAndSubjectStudentIdAndTypeAndCreatedAtAfter(
            UUID recipientUserId, UUID subjectStudentId, AlertType type, Instant after);
}
