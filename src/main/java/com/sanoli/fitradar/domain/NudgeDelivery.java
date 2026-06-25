package com.sanoli.fitradar.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "nudge_deliveries", indexes = {
        @Index(name = "idx_nudge_deliveries_creator_created", columnList = "creator_id, created_at"),
        @Index(name = "idx_nudge_deliveries_student_created", columnList = "student_id, created_at")
})
public class NudgeDelivery {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "creator_id", nullable = false)
    private UUID creatorId;

    @Column(name = "student_id", nullable = false)
    private UUID studentId;

    @Column(nullable = false, columnDefinition = "text")
    private String message;

    @Column(name = "email_sent", nullable = false)
    private boolean emailSent;

    @Column(name = "push_sent", nullable = false)
    private boolean pushSent;

    @Column(name = "email_detail", length = 500)
    private String emailDetail;

    @Column(name = "push_detail", length = 500)
    private String pushDetail;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void prePersist() {
        createdAt = Instant.now();
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getCreatorId() {
        return creatorId;
    }

    public void setCreatorId(UUID creatorId) {
        this.creatorId = creatorId;
    }

    public UUID getStudentId() {
        return studentId;
    }

    public void setStudentId(UUID studentId) {
        this.studentId = studentId;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public boolean isEmailSent() {
        return emailSent;
    }

    public void setEmailSent(boolean emailSent) {
        this.emailSent = emailSent;
    }

    public boolean isPushSent() {
        return pushSent;
    }

    public void setPushSent(boolean pushSent) {
        this.pushSent = pushSent;
    }

    public String getEmailDetail() {
        return emailDetail;
    }

    public void setEmailDetail(String emailDetail) {
        this.emailDetail = emailDetail;
    }

    public String getPushDetail() {
        return pushDetail;
    }

    public void setPushDetail(String pushDetail) {
        this.pushDetail = pushDetail;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
