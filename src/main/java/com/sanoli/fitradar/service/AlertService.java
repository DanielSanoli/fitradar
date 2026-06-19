package com.sanoli.fitradar.service;

import com.sanoli.fitradar.config.PaginationProperties;
import com.sanoli.fitradar.domain.Alert;
import com.sanoli.fitradar.dto.AlertResponse;
import com.sanoli.fitradar.dto.PageResponse;
import com.sanoli.fitradar.exception.ResourceNotFoundException;
import com.sanoli.fitradar.repository.AlertRepository;
import com.sanoli.fitradar.security.CurrentUserService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class AlertService {

    private final AlertRepository alertRepository;
    private final CurrentUserService currentUserService;
    private final PaginationProperties paginationProperties;

    public AlertService(
            AlertRepository alertRepository,
            CurrentUserService currentUserService,
            PaginationProperties paginationProperties
    ) {
        this.alertRepository = alertRepository;
        this.currentUserService = currentUserService;
        this.paginationProperties = paginationProperties;
    }

    @Transactional(readOnly = true)
    public PageResponse<AlertResponse> listForCurrentCreator(boolean unreadOnly, Integer page, Integer size) {
        UUID creatorId = currentUserService.requireCreator().getId();
        Pageable pageable = paginationProperties.toPageable(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Alert> alerts = unreadOnly
                ? alertRepository.findByRecipientUserIdAndReadFalseOrderByCreatedAtDesc(creatorId, pageable)
                : alertRepository.findByRecipientUserIdOrderByCreatedAtDesc(creatorId, pageable);
        return PageResponse.from(alerts.map(AlertResponse::fromEntity));
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
