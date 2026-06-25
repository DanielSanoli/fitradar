package com.sanoli.fitradar.repository;

import com.sanoli.fitradar.domain.NudgeDelivery;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface NudgeDeliveryRepository extends JpaRepository<NudgeDelivery, UUID> {
}
