package com.sanoli.fitradar.repository;

import com.sanoli.fitradar.domain.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {

    Optional<RefreshToken> findByTokenAndRevokedFalse(String token);

    List<RefreshToken> findByUser_IdAndRevokedFalseAndExpiresAtAfterOrderByCreatedAtDesc(
            UUID userId,
            LocalDateTime now
    );

    Optional<RefreshToken> findByIdAndUser_Id(UUID id, UUID userId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE RefreshToken r SET r.revoked = true WHERE r.user.id = :userId AND r.revoked = false")
    int revokeAllActiveForUser(@Param("userId") UUID userId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE RefreshToken r SET r.revoked = true WHERE r.token = :token AND r.revoked = false")
    int revokeByToken(@Param("token") String token);

    void deleteByUser_Id(UUID userId);
}
