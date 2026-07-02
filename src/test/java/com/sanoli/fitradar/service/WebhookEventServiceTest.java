package com.sanoli.fitradar.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.sanoli.fitradar.domain.WebhookEvent;
import com.sanoli.fitradar.domain.WebhookEventStatus;
import com.sanoli.fitradar.repository.WebhookEventRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class WebhookEventServiceTest {

    private WebhookEventRepository webhookEventRepository;
    private WebhookEventService webhookEventService;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        webhookEventRepository = mock(WebhookEventRepository.class);
        objectMapper = new ObjectMapper();
        webhookEventService = new WebhookEventService(webhookEventRepository, objectMapper);
    }

    @Test
    void beginProcessing_skipsAlreadyProcessedEvent() {
        WebhookEvent processed = new WebhookEvent();
        processed.setEventId("evt_done");
        processed.setStatus(WebhookEventStatus.PROCESSED);
        when(webhookEventRepository.findByEventId("evt_done")).thenReturn(Optional.of(processed));

        Optional<WebhookEvent> result = webhookEventService.beginProcessing("evt_done", "PAYMENT_CONFIRMED", "abc");

        assertThat(result).isEmpty();
        verify(webhookEventRepository, never()).save(any());
    }

    @Test
    void beginProcessing_reopensFailedEvent() {
        WebhookEvent failed = new WebhookEvent();
        failed.setEventId("evt_retry");
        failed.setStatus(WebhookEventStatus.FAILED);
        when(webhookEventRepository.findByEventId("evt_retry")).thenReturn(Optional.of(failed));
        when(webhookEventRepository.save(failed)).thenReturn(failed);

        Optional<WebhookEvent> result = webhookEventService.beginProcessing("evt_retry", "PAYMENT_CONFIRMED", "abc");

        assertThat(result).isPresent();
        assertThat(failed.getStatus()).isEqualTo(WebhookEventStatus.RECEIVED);
        verify(webhookEventRepository).save(failed);
    }

    @Test
    void complete_marksProcessedWithTimestamp() {
        WebhookEvent event = new WebhookEvent();
        event.setEventId("evt_ok");
        when(webhookEventRepository.findByEventId("evt_ok")).thenReturn(Optional.of(event));
        when(webhookEventRepository.save(event)).thenReturn(event);

        webhookEventService.complete("evt_ok", WebhookEventStatus.PROCESSED);

        assertThat(event.getStatus()).isEqualTo(WebhookEventStatus.PROCESSED);
        assertThat(event.getProcessedAt()).isNotNull();
    }

    @Test
    void hashPayload_isDeterministic() {
        ObjectNode payload = objectMapper.createObjectNode();
        payload.put("event", "PAYMENT_CONFIRMED");
        payload.put("id", "evt_hash");

        String first = webhookEventService.hashPayload(payload);
        String second = webhookEventService.hashPayload(payload);

        assertThat(first).isEqualTo(second);
        assertThat(first).hasSize(64);
    }
}
