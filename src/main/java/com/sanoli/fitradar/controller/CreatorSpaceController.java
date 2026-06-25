package com.sanoli.fitradar.controller;

import com.sanoli.fitradar.dto.CreatorSpaceRequest;
import com.sanoli.fitradar.dto.CreatorSpaceResponse;
import com.sanoli.fitradar.security.CurrentUserService;
import com.sanoli.fitradar.service.CreatorSpaceService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import com.sanoli.fitradar.dto.LogoUploadResponse;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

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

    @PostMapping(value = "/logo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Envia logo do espaço (PNG, JPG, WebP ou SVG, até 2 MB)")
    public ResponseEntity<LogoUploadResponse> uploadLogo(@RequestParam("file") MultipartFile file) {
        UUID creatorId = currentUserService.requireCreator().getId();
        String logoUrl = creatorSpaceService.uploadLogo(creatorId, file);
        return ResponseEntity.ok(new LogoUploadResponse(logoUrl));
    }
}
