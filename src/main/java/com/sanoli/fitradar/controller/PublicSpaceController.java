package com.sanoli.fitradar.controller;

import com.sanoli.fitradar.dto.CreatorSpaceResponse;
import com.sanoli.fitradar.service.CreatorSpaceService;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/public")
public class PublicSpaceController {

    private final CreatorSpaceService creatorSpaceService;

    public PublicSpaceController(CreatorSpaceService creatorSpaceService) {
        this.creatorSpaceService = creatorSpaceService;
    }

    @GetMapping("/spaces/{slug}")
    @Operation(summary = "Retorna a vitrine pública de um espaço pelo slug")
    public ResponseEntity<CreatorSpaceResponse> getBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(CreatorSpaceResponse.fromEntity(creatorSpaceService.getBySlug(slug)));
    }
}
