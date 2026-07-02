package com.sanoli.fitradar.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sanoli.fitradar.domain.WebhookEvent;
import com.sanoli.fitradar.domain.WebhookEventStatus;
import com.sanoli.fitradar.repository.WebhookEventRepository;
import com.sanoli.fitradar.security.TokenHashUtil;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class WebhookEventService {

    private final WebhookEventRepository webhookEventRepository;
    private final ObjectMapper objectMapper;

    public WebhookEventService(WebhookEventRepository webhookEventRepository, ObjectMapper objectMapper) {
        this.webhookEventRepository = webhookEventRepository;
        this.objectMapper = objectMapper;
    }

    /**
     * Registers or reopens a webhook event for processing.
     *
     * @return empty when the event was already PROCESSED/IGNORED (idempotent skip)
     */
    @Transactional
    public Optional<WebhookEvent> beginProcessing(String eventId, String eventType, String payloadHash) {
        Optional<WebhookEvent> existing = webhookEventRepository.findByEventId(eventId);
        if (existing.isPresent()) {
            WebhookEvent event = existing.get();
            if (event.getStatus() == WebhookEventStatus.PROCESSED
                    || event.getStatus() == WebhookEventStatus.IGNORED) {
                return Optional.empty();
            }
            event.setStatus(WebhookEventStatus.RECEIVED);
            event.setEventType(eventType);
            event.setPayloadHash(payloadHash);
            event.setReceivedAt(LocalDateTime.now());
            event.setProcessedAt(null);
            return Optional.of(webhookEventRepository.save(event));
        }

        WebhookEvent created = new WebhookEvent();
        created.setEventId(eventId);
        created.setEventType(eventType);
        created.setPayloadHash(payloadHash);
        created.setStatus(WebhookEventStatus.RECEIVED);
        created.setReceivedAt(LocalDateTime.now());

        try {
            return Optional.of(webhookEventRepository.save(created));
        } catch (DataIntegrityViolationException exception) {
            return beginProcessing(eventId, eventType, payloadHash);
        }
    }

    @Transactional
    public void complete(String eventId, WebhookEventStatus status) {
        WebhookEvent event = webhookEventRepository.findByEventId(eventId)
                .orElseThrow(() -> new IllegalStateException("Webhook event not found: " + eventId));
        event.setStatus(status);
        event.setProcessedAt(LocalDateTime.now());
        webhookEventRepository.save(event);
    }

    @Transactional
    public void markFailed(String eventId) {
        webhookEventRepository.findByEventId(eventId).ifPresent(event -> {
            event.setStatus(WebhookEventStatus.FAILED);
            event.setProcessedAt(LocalDateTime.now());
            webhookEventRepository.save(event);
        });
    }

    public String hashPayload(JsonNode payload) {
        try {
            return TokenHashUtil.sha256Hex(objectMapper.writeValueAsString(payload));
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Unable to hash webhook payload", exception);
        }
    }
}
