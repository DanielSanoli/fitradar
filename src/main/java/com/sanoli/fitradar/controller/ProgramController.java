package com.sanoli.fitradar.controller;

import com.sanoli.fitradar.dto.ProgramRequest;
import com.sanoli.fitradar.dto.ProgramResponse;
import com.sanoli.fitradar.dto.WorkoutRequest;
import com.sanoli.fitradar.dto.WorkoutResponse;
import com.sanoli.fitradar.security.CurrentUserService;
import com.sanoli.fitradar.service.ProgramService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/programs")
public class ProgramController {

    private final ProgramService programService;
    private final CurrentUserService currentUserService;

    public ProgramController(ProgramService programService, CurrentUserService currentUserService) {
        this.programService = programService;
        this.currentUserService = currentUserService;
    }

    private UUID creatorId() {
        return currentUserService.requireCreator().getId();
    }

    @GetMapping
    @Operation(summary = "Lista os programas do criador")
    public ResponseEntity<List<ProgramResponse>> list() {
        return ResponseEntity.ok(programService.listForCreator(creatorId()));
    }

    @PostMapping
    @Operation(summary = "Cria um programa")
    public ResponseEntity<ProgramResponse> create(@Valid @RequestBody ProgramRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(programService.create(creatorId(), request));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Detalha um programa")
    public ResponseEntity<ProgramResponse> get(@PathVariable UUID id) {
        return ResponseEntity.ok(programService.get(creatorId(), id));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualiza um programa")
    public ResponseEntity<ProgramResponse> update(@PathVariable UUID id, @Valid @RequestBody ProgramRequest request) {
        return ResponseEntity.ok(programService.update(creatorId(), id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Remove um programa")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        programService.delete(creatorId(), id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/workouts")
    @Operation(summary = "Lista os treinos de um programa")
    public ResponseEntity<List<WorkoutResponse>> listWorkouts(@PathVariable UUID id) {
        return ResponseEntity.ok(programService.listWorkouts(creatorId(), id));
    }

    @PostMapping("/{id}/workouts")
    @Operation(summary = "Adiciona um treino ao programa")
    public ResponseEntity<WorkoutResponse> addWorkout(@PathVariable UUID id, @Valid @RequestBody WorkoutRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(programService.addWorkout(creatorId(), id, request));
    }

    @PutMapping("/{id}/workouts/{workoutId}")
    @Operation(summary = "Atualiza um treino")
    public ResponseEntity<WorkoutResponse> updateWorkout(
            @PathVariable UUID id,
            @PathVariable UUID workoutId,
            @Valid @RequestBody WorkoutRequest request
    ) {
        return ResponseEntity.ok(programService.updateWorkout(creatorId(), id, workoutId, request));
    }

    @DeleteMapping("/{id}/workouts/{workoutId}")
    @Operation(summary = "Remove um treino")
    public ResponseEntity<Void> deleteWorkout(@PathVariable UUID id, @PathVariable UUID workoutId) {
        programService.deleteWorkout(creatorId(), id, workoutId);
        return ResponseEntity.noContent().build();
    }
}
