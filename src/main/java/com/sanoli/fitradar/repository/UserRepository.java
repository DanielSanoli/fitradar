package com.sanoli.fitradar.repository;

import com.sanoli.fitradar.domain.AppUser;
import com.sanoli.fitradar.domain.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<AppUser, UUID> {

    Optional<AppUser> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    Optional<AppUser> findByAsaasSubscriptionId(String asaasSubscriptionId);

    List<AppUser> findByRole(UserRole role);

    List<AppUser> findByCreatorIdAndRole(UUID creatorId, UserRole role);

    long countByCreatorIdAndRole(UUID creatorId, UserRole role);

    Optional<AppUser> findByIdAndCreatorId(UUID id, UUID creatorId);
}
