package com.sanoli.fitradar.service;

import com.sanoli.fitradar.domain.Alert;
import com.sanoli.fitradar.dto.AlertResponse;
import com.sanoli.fitradar.exception.ResourceNotFoundException;
import com.sanoli.fitradar.repository.AlertRepository;
import com.sanoli.fitradar.security.CurrentUserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class AlertService {

    private final AlertRepository alertRepository;
    private final CurrentUserService currentUserService;

    public AlertService(AlertRepository alertRepository, CurrentUserService currentUserService) {
        this.alertRepository = alertRepository;
        this.currentUserService = currentUserService;
    }

    @Transactional(readOnly = true)
    public List<AlertResponse> listForCurrentCreator(boolean unreadOnly) {
        UUID creatorId = currentUserService.requireCreator().getId();
        List<Alert> alerts = unreadOnly
                ? alertRepository.findByRecipientUserIdAndReadFalseOrderByCreatedAtDesc(creatorId)
                : alertRepository.findByRecipientUserIdOrderByCreatedAtDesc(creatorId);
        return alerts.stream().map(AlertResponse::fromEntity).toList();
    }

    @Transactional
    public AlertResponse markAsRead(UUID id) {
        UUID creatorId = currentUserService.requireCreator().getId();
        Alert alert = alertRepository.findByIdAndRecipientUserId(id, creatorId)
                .orElseThrow(() -> new ResourceNotFoundException("Alerta não encontrado: " + id));
        alert.setRead(true);
        return AlertResponse.fromEntity(alertRepository.save(alert));
    }
}
