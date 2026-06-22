package com.sanoli.fitradar.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sanoli.fitradar.config.PushProperties;
import com.sanoli.fitradar.domain.PushSubscription;
import com.sanoli.fitradar.dto.PushSubscribeRequest;
import com.sanoli.fitradar.repository.PushSubscriptionRepository;
import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.PushService;
import nl.martijndwars.webpush.Subscription;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.GeneralSecurityException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class PushNotificationService {

    private static final Logger log = LoggerFactory.getLogger(PushNotificationService.class);

    private final PushProperties properties;
    private final PushSubscriptionRepository repository;
    private final ObjectMapper objectMapper;
    private volatile PushService pushService;

    public PushNotificationService(
            PushProperties properties,
            PushSubscriptionRepository repository,
            ObjectMapper objectMapper
    ) {
        this.properties = properties;
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    public boolean isEnabled() {
        return properties.isConfigured();
    }

    public String publicKey() {
        return properties.getVapidPublicKey();
    }

    @Transactional
    public void subscribe(UUID userId, PushSubscribeRequest request) {
        PushSubscription sub = repository.findByEndpoint(request.endpoint())
                .orElseGet(PushSubscription::new);
        sub.setUserId(userId);
        sub.setEndpoint(request.endpoint());
        sub.setP256dh(request.p256dh());
        sub.setAuthKey(request.auth());
        repository.save(sub);
        log.info("[push] subscription saved userId={}", userId);
    }

    @Transactional
    public void unsubscribe(UUID userId) {
        repository.deleteByUserId(userId);
        log.info("[push] subscriptions removed userId={}", userId);
    }

    public boolean hasSubscription(UUID userId) {
        return !repository.findByUserId(userId).isEmpty();
    }

    public void sendToUser(UUID userId, String title, String body, String path) {
        if (!isEnabled()) {
            return;
        }
        List<PushSubscription> subs = repository.findByUserId(userId);
        if (subs.isEmpty()) {
            return;
        }
        String url = buildUrl(path);
        String payload = buildPayload(title, body, url);
        for (PushSubscription sub : subs) {
            sendOne(sub, payload);
        }
    }

    public void sendTest(UUID userId) {
        sendToUser(userId, "FitRadar", "Notificações ativas — você receberá lembretes por aqui.", "/student");
    }

    private String buildUrl(String path) {
        String base = properties.getFrontendBaseUrl().replaceAll("/$", "");
        if (path == null || path.isBlank()) {
            return base + "/";
        }
        return path.startsWith("http") ? path : base + (path.startsWith("/") ? path : "/" + path);
    }

    private String buildPayload(String title, String body, String url) {
        try {
            Map<String, String> map = new HashMap<>();
            map.put("title", title);
            map.put("body", body);
            map.put("url", url);
            map.put("tag", "fitradar-nudge");
            return objectMapper.writeValueAsString(map);
        } catch (Exception exception) {
            return "{\"title\":\"FitRadar\",\"body\":\"" + body.replace("\"", "'") + "\"}";
        }
    }

    private void sendOne(PushSubscription sub, String payload) {
        try {
            PushService service = pushService();
            Subscription subscription = new Subscription(
                    sub.getEndpoint(),
                    new Subscription.Keys(sub.getP256dh(), sub.getAuthKey())
            );
            Notification notification = new Notification(subscription, payload);
            service.send(notification);
        } catch (Exception exception) {
            log.warn("[push] falha ao enviar endpoint={} — {}", sub.getEndpoint(), exception.getMessage());
            if (isGone(exception)) {
                repository.delete(sub);
            }
        }
    }

    private boolean isGone(Exception exception) {
        String msg = exception.getMessage();
        return msg != null && (msg.contains("410") || msg.contains("404") || msg.contains("Gone"));
    }

    private PushService pushService() throws GeneralSecurityException {
        if (pushService == null) {
            synchronized (this) {
                if (pushService == null) {
                    PushService service = new PushService();
                    service.setPublicKey(properties.getVapidPublicKey());
                    service.setPrivateKey(properties.getVapidPrivateKey());
                    service.setSubject(properties.getVapidSubject());
                    pushService = service;
                }
            }
        }
        return pushService;
    }
}
