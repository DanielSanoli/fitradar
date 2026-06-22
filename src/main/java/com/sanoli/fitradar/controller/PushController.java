package com.sanoli.fitradar.controller;

import com.sanoli.fitradar.dto.MessageResponse;
import com.sanoli.fitradar.dto.PushConfigResponse;
import com.sanoli.fitradar.dto.PushSubscribeRequest;
import com.sanoli.fitradar.security.CurrentUserService;
import com.sanoli.fitradar.service.PushNotificationService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/push")
public class PushController {

    private final PushNotificationService pushService;
    private final CurrentUserService currentUserService;

    public PushController(PushNotificationService pushService, CurrentUserService currentUserService) {
        this.pushService = pushService;
        this.currentUserService = currentUserService;
    }

    @GetMapping("/config")
    @Operation(summary = "Configuração pública de push (chave VAPID)")
    public ResponseEntity<PushConfigResponse> config() {
        return ResponseEntity.ok(new PushConfigResponse(
                pushService.isEnabled(),
                pushService.isEnabled() ? pushService.publicKey() : null
        ));
    }

    @PostMapping("/subscribe")
    @Operation(summary = "Registra subscription Web Push do usuário autenticado")
    public ResponseEntity<MessageResponse> subscribe(@Valid @RequestBody PushSubscribeRequest request) {
        if (!pushService.isEnabled()) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(new MessageResponse("Push não configurado no servidor."));
        }
        pushService.subscribe(currentUserService.getCurrentUser().getId(), request);
        return ResponseEntity.ok(new MessageResponse("Subscription registrada."));
    }

    @DeleteMapping("/subscribe")
    @Operation(summary = "Remove todas as subscriptions push do usuário")
    public ResponseEntity<MessageResponse> unsubscribe() {
        pushService.unsubscribe(currentUserService.getCurrentUser().getId());
        return ResponseEntity.ok(new MessageResponse("Notificações desativadas."));
    }

    @PostMapping("/test")
    @Operation(summary = "Envia notificação de teste ao usuário autenticado")
    public ResponseEntity<MessageResponse> test() {
        if (!pushService.isEnabled()) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(new MessageResponse("Push não configurado no servidor."));
        }
        pushService.sendTest(currentUserService.getCurrentUser().getId());
        return ResponseEntity.ok(new MessageResponse("Notificação de teste enviada."));
    }
}
