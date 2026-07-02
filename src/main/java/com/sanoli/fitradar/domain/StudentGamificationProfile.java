package com.sanoli.fitradar.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Perfil de gamificação persistido (streak, totais) por aluno.
 */
@Entity
@Table(name = "student_gamification_profiles")
public class StudentGamificationProfile {

    @Id
    @Column(name = "student_id")
    private UUID studentId;

    @Column(name = "creator_id", nullable = false)
    private UUID creatorId;

    @Column(name = "current_streak", nullable = false)
    private int currentStreak;

    @Column(name = "longest_streak", nullable = false)
    private int longestStreak;

    @Column(name = "total_check_ins_done", nullable = false)
    private int totalCheckInsDone;

    @Column(name = "last_activity_date")
    private LocalDate lastActivityDate;

    @Column(name = "streak_shields", nullable = false)
    private int streakShields;

    @Column(name = "shield_earn_progress", nullable = false)
    private int shieldEarnProgress;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    @PrePersist
    void prePersist() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = Instant.now();
    }

    public UUID getStudentId() {
        return studentId;
    }

    public void setStudentId(UUID studentId) {
        this.studentId = studentId;
    }

    public UUID getCreatorId() {
        return creatorId;
    }

    public void setCreatorId(UUID creatorId) {
        this.creatorId = creatorId;
    }

    public int getCurrentStreak() {
        return currentStreak;
    }

    public void setCurrentStreak(int currentStreak) {
        this.currentStreak = currentStreak;
    }

    public int getLongestStreak() {
        return longestStreak;
    }

    public void setLongestStreak(int longestStreak) {
        this.longestStreak = longestStreak;
    }

    public int getTotalCheckInsDone() {
        return totalCheckInsDone;
    }

    public void setTotalCheckInsDone(int totalCheckInsDone) {
        this.totalCheckInsDone = totalCheckInsDone;
    }

    public LocalDate getLastActivityDate() {
        return lastActivityDate;
    }

    public void setLastActivityDate(LocalDate lastActivityDate) {
        this.lastActivityDate = lastActivityDate;
    }

    public int getStreakShields() {
        return streakShields;
    }

    public void setStreakShields(int streakShields) {
        this.streakShields = streakShields;
    }

    public int getShieldEarnProgress() {
        return shieldEarnProgress;
    }

    public void setShieldEarnProgress(int shieldEarnProgress) {
        this.shieldEarnProgress = shieldEarnProgress;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
