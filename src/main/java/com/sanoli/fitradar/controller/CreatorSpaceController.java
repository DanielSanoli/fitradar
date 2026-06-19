package com.sanoli.fitradar.controller;

import com.sanoli.fitradar.dto.CreatorSpaceRequest;
import com.sanoli.fitradar.dto.CreatorSpaceResponse;
import com.sanoli.fitradar.security.CurrentUserService;
import com.sanoli.fitradar.service.CreatorSpaceService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/creator-space")
public class CreatorSpaceController {

    private final CreatorSpaceService creatorSpaceService;
    private final CurrentUserService currentUserService;

    public CreatorSpaceController(CreatorSpaceService creatorSpaceService, CurrentUserService currentUserService) {
        this.creatorSpaceService = creatorSpaceService;
        this.currentUserService = currentUserService;
    }

    @GetMapping
    @Operation(summary = "Retorna o espaço do criador autenticado")
    public ResponseEntity<CreatorSpaceResponse> getMySpace() {
        UUID creatorId = currentUserService.requireCreator().getId();
        return ResponseEntity.ok(CreatorSpaceResponse.fromEntity(creatorSpaceService.getByCreatorId(creatorId)));
    }

    @PutMapping
    @Operation(summary = "Cria ou atualiza o espaço (builder no-code) do criador")
    public ResponseEntity<CreatorSpaceResponse> saveMySpace(@Valid @RequestBody CreatorSpaceRequest request) {
        UUID creatorId = currentUserService.requireCreator().getId();
        return ResponseEntity.ok(CreatorSpaceResponse.fromEntity(creatorSpaceService.save(creatorId, request)));
    }
}
