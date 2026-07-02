package com.sanoli.fitradar.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "progress_photo_consents")
public class ProgressPhotoConsent {

    @Id
    @Column(name = "student_id")
    private UUID studentId;

    @Column(name = "consented_at", nullable = false, updatable = false)
    private Instant consentedAt;

    @PrePersist
    void prePersist() {
        if (consentedAt == null) {
            consentedAt = Instant.now();
        }
    }

    public UUID getStudentId() {
        return studentId;
    }

    public void setStudentId(UUID studentId) {
        this.studentId = studentId;
    }

    public Instant getConsentedAt() {
        return consentedAt;
    }

    public void setConsentedAt(Instant consentedAt) {
        this.consentedAt = consentedAt;
    }
}
