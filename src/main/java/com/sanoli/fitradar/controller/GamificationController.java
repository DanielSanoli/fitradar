package com.sanoli.fitradar.controller;

import com.sanoli.fitradar.dto.GamificationProfileResponse;
import com.sanoli.fitradar.dto.LeaderboardEntryResponse;
import com.sanoli.fitradar.security.CurrentUserService;
import com.sanoli.fitradar.service.GamificationService;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/gamification")
public class GamificationController {

    private final GamificationService gamificationService;
    private final CurrentUserService currentUserService;

    public GamificationController(GamificationService gamificationService, CurrentUserService currentUserService) {
        this.gamificationService = gamificationService;
        this.currentUserService = currentUserService;
    }

    @GetMapping("/leaderboard")
    @Operation(summary = "Ranking de engajamento da comunidade do criador")
    public ResponseEntity<List<LeaderboardEntryResponse>> leaderboard(
            @RequestParam(name = "limit", defaultValue = "10") int limit
    ) {
        UUID creatorId = currentUserService.requireCreator().getId();
        int safeLimit = Math.max(1, Math.min(limit, 50));
        return ResponseEntity.ok(gamificationService.leaderboard(creatorId, safeLimit));
    }
}
