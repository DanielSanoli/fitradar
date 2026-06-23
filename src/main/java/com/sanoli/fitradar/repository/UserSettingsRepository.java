package com.sanoli.fitradar.repository;

import com.sanoli.fitradar.domain.UserSettings;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface UserSettingsRepository extends JpaRepository<UserSettings, UUID> {
}
