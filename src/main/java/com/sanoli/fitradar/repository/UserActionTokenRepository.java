package com.sanoli.fitradar.repository;

import com.sanoli.fitradar.domain.TokenPurpose;
import com.sanoli.fitradar.domain.UserActionToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface UserActionTokenRepository extends JpaRepository<UserActionToken, UUID> {

    Optional<UserActionToken> findByTokenHashAndPurposeAndUsedFalse(String tokenHash, TokenPurpose purpose);

    void deleteByUser_Id(UUID userId);
}
