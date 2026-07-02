package com.sanoli.fitradar.controller;

import com.sanoli.fitradar.domain.AppUser;
import com.sanoli.fitradar.dto.ProgressPhotoConsentRequest;
import com.sanoli.fitradar.dto.ProgressPhotoConsentResponse;
import com.sanoli.fitradar.dto.ProgressPhotoResponse;
import com.sanoli.fitradar.dto.ProgressPhotoSharingRequest;
import com.sanoli.fitradar.security.CurrentUserService;
import com.sanoli.fitradar.service.ProgressPhotoService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import org.springframework.core.io.Resource;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/my/progress-photos")
public class MemberProgressPhotoController {

    private final ProgressPhotoService progressPhotoService;
    private final CurrentUserService currentUserService;

    public MemberProgressPhotoController(
            ProgressPhotoService progressPhotoService,
            CurrentUserService currentUserService
    ) {
        this.progressPhotoService = progressPhotoService;
        this.currentUserService = currentUserService;
    }

    @GetMapping("/consent")
    @Operation(summary = "Status do consentimento para fotos de progresso")
    public ResponseEntity<ProgressPhotoConsentResponse> consentStatus() {
        return ResponseEntity.ok(progressPhotoService.consentStatus(currentUserService.requireStudent()));
    }

    @PostMapping("/consent")
    @Operation(summary = "Concede consentimento para fotos de progresso corporal")
    public ResponseEntity<ProgressPhotoConsentResponse> grantConsent(
            @Valid @RequestBody ProgressPhotoConsentRequest request
    ) {
        boolean consented = Boolean.TRUE.equals(request.consentProgressPhotos());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(progressPhotoService.grantConsent(currentUserService.requireStudent(), consented));
    }

    @GetMapping
    @Operation(summary = "Lista fotos de progresso do aluno (cronológico)")
    public ResponseEntity<List<ProgressPhotoResponse>> list() {
        return ResponseEntity.ok(progressPhotoService.listMine(currentUserService.requireStudent()));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Envia foto de progresso")
    public ResponseEntity<ProgressPhotoResponse> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam("date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(value = "note", required = false) String note,
            @RequestParam(value = "weight", required = false) BigDecimal weight
    ) {
        AppUser student = currentUserService.requireStudent();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(progressPhotoService.upload(student, date, note, weight, file));
    }

    @GetMapping("/{id}/content")
    @Operation(summary = "Baixa conteúdo da foto (somente dono autenticado)")
    public ResponseEntity<Resource> content(@PathVariable UUID id) {
        ProgressPhotoService.PhotoContent content =
                progressPhotoService.loadForStudent(currentUserService.requireStudent(), id);
        return ResponseEntity.ok()
                .contentType(content.mediaType())
                .header(HttpHeaders.CACHE_CONTROL, "private, no-store")
                .body(content.resource());
    }

    @PatchMapping("/{id}/sharing")
    @Operation(summary = "Alterna compartilhamento da foto com o coach")
    public ResponseEntity<ProgressPhotoResponse> updateSharing(
            @PathVariable UUID id,
            @Valid @RequestBody ProgressPhotoSharingRequest request
    ) {
        return ResponseEntity.ok(progressPhotoService.updateSharing(
                currentUserService.requireStudent(), id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Remove foto de progresso")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        progressPhotoService.delete(currentUserService.requireStudent(), id);
        return ResponseEntity.noContent().build();
    }
}
