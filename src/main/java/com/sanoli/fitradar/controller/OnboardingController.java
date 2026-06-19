package com.sanoli.fitradar.controller;

import com.sanoli.fitradar.dto.OnboardingStatusResponse;
import com.sanoli.fitradar.security.CurrentUserService;
import com.sanoli.fitradar.service.OnboardingService;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/onboarding")
public class OnboardingController {

    private final OnboardingService onboardingService;
    private final CurrentUserService currentUserService;

    public OnboardingController(OnboardingService onboardingService, CurrentUserService currentUserService) {
        this.onboardingService = onboardingService;
        this.currentUserService = currentUserService;
    }

    @GetMapping("/status")
    @Operation(summary = "Status do onboarding do criador (espaço, programa, aluno)")
    public ResponseEntity<OnboardingStatusResponse> status() {
        var creator = currentUserService.requireCreator();
        return ResponseEntity.ok(onboardingService.status(creator.getId()));
    }

    @PostMapping("/demo-seed")
    @Operation(summary = "Cria programas demo para visualizar o espaço preenchido")
    public ResponseEntity<OnboardingStatusResponse> seedDemo() {
        var creator = currentUserService.requireCreator();
        return ResponseEntity.ok(onboardingService.seedDemo(creator));
    }
}
