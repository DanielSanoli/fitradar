package com.sanoli.fitradar.repository;

import com.sanoli.fitradar.domain.ProgressPhotoConsent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ProgressPhotoConsentRepository extends JpaRepository<ProgressPhotoConsent, UUID> {
}
