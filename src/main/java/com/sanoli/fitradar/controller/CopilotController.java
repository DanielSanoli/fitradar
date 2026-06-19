package com.sanoli.fitradar.controller;

import com.sanoli.fitradar.dto.CopilotAskRequest;
import com.sanoli.fitradar.dto.CopilotAskResponse;
import com.sanoli.fitradar.retention.ai.NudgeService;
import com.sanoli.fitradar.retention.ai.NudgeSuggestion;
import com.sanoli.fitradar.retention.ai.RetentionCopilotService;
import com.sanoli.fitradar.security.CurrentUserService;
import com.sanoli.fitradar.service.StudentService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/copilot")
public class CopilotController {

    private final RetentionCopilotService copilotService;
    private final NudgeService nudgeService;
    private final StudentService studentService;
    private final CurrentUserService currentUserService;

    public CopilotController(
            RetentionCopilotService copilotService,
            NudgeService nudgeService,
            StudentService studentService,
            CurrentUserService currentUserService
    ) {
        this.copilotService = copilotService;
        this.nudgeService = nudgeService;
        this.studentService = studentService;
        this.currentUserService = currentUserService;
    }

    @PostMapping("/ask")
    @Operation(summary = "Pergunta ao copiloto de retenção (criador ou aluno)")
    public ResponseEntity<CopilotAskResponse> ask(@Valid @RequestBody CopilotAskRequest request) {
        return ResponseEntity.ok(copilotService.ask(request.question()));
    }

    @PostMapping("/nudge/{studentId}")
    @Operation(summary = "Gera uma mensagem de reativação (nudge) para um aluno")
    public ResponseEntity<NudgeSuggestion> suggestNudge(@PathVariable UUID studentId) {
        UUID creatorId = currentUserService.requireCreator().getId();
        studentService.requireStudent(creatorId, studentId);
        return ResponseEntity.ok(nudgeService.buildNudge(studentId));
    }
}
