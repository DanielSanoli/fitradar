package com.sanoli.fitradar.service;

import com.sanoli.fitradar.config.PushProperties;
import com.sanoli.fitradar.domain.PushSubscription;
import com.sanoli.fitradar.dto.PushSubscribeRequest;
import com.sanoli.fitradar.repository.PushSubscriptionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PushNotificationServiceTest {

    @Mock
    private PushSubscriptionRepository repository;

    private PushNotificationService service;

    @BeforeEach
    void setUp() {
        PushProperties properties = new PushProperties();
        properties.setEnabled(false);
        service = new PushNotificationService(properties, repository, new com.fasterxml.jackson.databind.ObjectMapper());
    }

    @Test
    void subscribeUpsertsSubscription() {
        propertiesEnabled();
        UUID userId = UUID.randomUUID();
        when(repository.findByEndpoint("https://push.example/1")).thenReturn(Optional.empty());
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        service.subscribe(userId, new PushSubscribeRequest("https://push.example/1", "key", "auth"));

        ArgumentCaptor<PushSubscription> captor = ArgumentCaptor.forClass(PushSubscription.class);
        verify(repository).save(captor.capture());
        assertThat(captor.getValue().getUserId()).isEqualTo(userId);
        assertThat(captor.getValue().getEndpoint()).isEqualTo("https://push.example/1");
    }

    @Test
    void sendToUserSkipsWhenDisabled() {
        service.sendToUser(UUID.randomUUID(), "t", "b", "/student");
        verify(repository, never()).findByUserId(any());
    }

    @Test
    void unsubscribeDeletesByUser() {
        UUID userId = UUID.randomUUID();
        service.unsubscribe(userId);
        verify(repository).deleteByUserId(userId);
    }

    private void propertiesEnabled() {
        PushProperties properties = new PushProperties();
        properties.setEnabled(true);
        properties.setVapidPublicKey("BPublic");
        properties.setVapidPrivateKey("Private");
        service = new PushNotificationService(properties, repository, new com.fasterxml.jackson.databind.ObjectMapper());
    }
}
