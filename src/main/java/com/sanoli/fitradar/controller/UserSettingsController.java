package com.sanoli.fitradar.controller;

import com.sanoli.fitradar.dto.UserSettingsResponse;
import com.sanoli.fitradar.dto.UserSettingsUpdateRequest;
import com.sanoli.fitradar.security.CurrentUserService;
import com.sanoli.fitradar.service.UserSettingsService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/user-settings")
public class UserSettingsController {

    private final UserSettingsService userSettingsService;
    private final CurrentUserService currentUserService;

    public UserSettingsController(UserSettingsService userSettingsService, CurrentUserService currentUserService) {
        this.userSettingsService = userSettingsService;
        this.currentUserService = currentUserService;
    }

    @GetMapping
    @Operation(summary = "Preferências do usuário autenticado")
    public ResponseEntity<UserSettingsResponse> get() {
        var user = currentUserService.getCurrentUser();
        return ResponseEntity.ok(userSettingsService.get(user.getId()));
    }

    @PatchMapping
    @Operation(summary = "Atualiza preferências do usuário autenticado")
    public ResponseEntity<UserSettingsResponse> update(@Valid @RequestBody UserSettingsUpdateRequest request) {
        var user = currentUserService.getCurrentUser();
        return ResponseEntity.ok(userSettingsService.update(user.getId(), request));
    }
}
