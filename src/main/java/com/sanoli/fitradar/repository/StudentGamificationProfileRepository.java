package com.sanoli.fitradar.repository;

import com.sanoli.fitradar.domain.StudentGamificationProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface StudentGamificationProfileRepository extends JpaRepository<StudentGamificationProfile, UUID> {

    List<StudentGamificationProfile> findByCreatorIdOrderByCurrentStreakDescTotalCheckInsDoneDesc(UUID creatorId);

    @Query("""
            select p from StudentGamificationProfile p
            where p.creatorId = :creatorId
            order by p.currentStreak desc, p.totalCheckInsDone desc
            """)
    List<StudentGamificationProfile> leaderboard(@Param("creatorId") UUID creatorId);
}
