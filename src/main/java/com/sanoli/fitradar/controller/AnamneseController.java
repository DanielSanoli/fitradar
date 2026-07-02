package com.sanoli.fitradar.controller;

import com.sanoli.fitradar.domain.AppUser;
import com.sanoli.fitradar.dto.AnamneseRequest;
import com.sanoli.fitradar.dto.AnamneseResponse;
import com.sanoli.fitradar.security.CurrentUserService;
import com.sanoli.fitradar.service.AnamneseService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/anamnese")
public class AnamneseController {

    private final AnamneseService anamneseService;
    private final CurrentUserService currentUserService;

    public AnamneseController(AnamneseService anamneseService, CurrentUserService currentUserService) {
        this.anamneseService = anamneseService;
        this.currentUserService = currentUserService;
    }

    @PostMapping
    @Operation(summary = "Aluno preenche a anamnese (única vez)")
    public ResponseEntity<AnamneseResponse> create(@Valid @RequestBody AnamneseRequest request) {
        AppUser student = currentUserService.requireStudent();
        return ResponseEntity.status(HttpStatus.CREATED).body(anamneseService.create(student, request));
    }

    @GetMapping("/me")
    @Operation(summary = "Aluno consulta a própria anamnese")
    public ResponseEntity<AnamneseResponse> mine() {
        return ResponseEntity.ok(anamneseService.getMine(currentUserService.requireStudent()));
    }

    @GetMapping("/student/{studentId}")
    @Operation(summary = "Criador consulta a anamnese de um aluno")
    public ResponseEntity<AnamneseResponse> forStudent(@PathVariable UUID studentId) {
        AppUser creator = currentUserService.requireCreator();
        return ResponseEntity.ok(anamneseService.getForCreator(creator, studentId));
    }
}
