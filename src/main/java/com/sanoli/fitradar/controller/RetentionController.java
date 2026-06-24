package com.sanoli.fitradar.controller;

import com.sanoli.fitradar.domain.RiskLevel;
import com.sanoli.fitradar.dto.AlertResponse;
import com.sanoli.fitradar.dto.PageResponse;
import com.sanoli.fitradar.retention.engine.ChurnRiskResult;
import com.sanoli.fitradar.retention.engine.CreatorAdherenceTrendResult;
import com.sanoli.fitradar.retention.engine.CreatorOverviewResult;
import com.sanoli.fitradar.retention.engine.CreatorRankingResult;
import com.sanoli.fitradar.retention.engine.RankingMetric;
import com.sanoli.fitradar.retention.engine.RankingPeriod;
import com.sanoli.fitradar.retention.engine.RetentionEngineService;
import com.sanoli.fitradar.retention.engine.StudentProgressResult;
import com.sanoli.fitradar.retention.rules.RetentionRuleEngine;
import com.sanoli.fitradar.security.CurrentUserService;
import com.sanoli.fitradar.service.AlertService;
import com.sanoli.fitradar.service.StudentService;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/retention")
public class RetentionController {

    private final RetentionEngineService engine;
    private final RetentionRuleEngine ruleEngine;
    private final AlertService alertService;
    private final StudentService studentService;
    private final CurrentUserService currentUserService;

    public RetentionController(
            RetentionEngineService engine,
            RetentionRuleEngine ruleEngine,
            AlertService alertService,
            StudentService studentService,
            CurrentUserService currentUserService
    ) {
        this.engine = engine;
        this.ruleEngine = ruleEngine;
        this.alertService = alertService;
        this.studentService = studentService;
        this.currentUserService = currentUserService;
    }

    private UUID creatorId() {
        return currentUserService.requireCreator().getId();
    }

    @GetMapping("/overview")
    @Operation(summary = "Painel de retenção do criador")
    public ResponseEntity<CreatorOverviewResult> overview() {
        return ResponseEntity.ok(engine.creatorOverview(creatorId()));
    }

    @GetMapping("/adherence-trend")
    @Operation(summary = "Tendência de aderência da comunidade (motor determinístico)")
    public ResponseEntity<CreatorAdherenceTrendResult> adherenceTrend() {
        return ResponseEntity.ok(engine.creatorAdherenceTrend(creatorId()));
    }

    @GetMapping("/ranking")
    @Operation(summary = "Ranking da comunidade do criador (motor determinístico)")
    public ResponseEntity<CreatorRankingResult> ranking(
            @RequestParam(name = "metric", defaultValue = "ADHERENCE") RankingMetric metric,
            @RequestParam(name = "period", defaultValue = "WEEK") RankingPeriod period
    ) {
        return ResponseEntity.ok(engine.creatorRanking(creatorId(), metric, period));
    }

    @GetMapping("/students-at-risk")
    @Operation(summary = "Lista os alunos em risco de churn")
    public ResponseEntity<List<ChurnRiskResult>> studentsAtRisk(
            @RequestParam(name = "minLevel", defaultValue = "MEDIUM") RiskLevel minLevel
    ) {
        return ResponseEntity.ok(engine.studentsAtRisk(creatorId(), minLevel));
    }

    @GetMapping("/students/{studentId}/risk")
    @Operation(summary = "Risco de churn de um aluno específico")
    public ResponseEntity<ChurnRiskResult> studentRisk(@PathVariable UUID studentId) {
        studentService.requireStudent(creatorId(), studentId);
        return ResponseEntity.ok(engine.churnRiskScore(studentId));
    }

    @GetMapping("/students/{studentId}/progress")
    @Operation(summary = "Progresso de um aluno específico")
    public ResponseEntity<StudentProgressResult> studentProgress(@PathVariable UUID studentId) {
        studentService.requireStudent(creatorId(), studentId);
        return ResponseEntity.ok(engine.studentProgress(studentId));
    }

    @GetMapping("/alerts")
    @Operation(summary = "Lista os alertas de retenção do criador")
    public ResponseEntity<PageResponse<AlertResponse>> alerts(
            @RequestParam(name = "unreadOnly", defaultValue = "false") boolean unreadOnly,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size
    ) {
        return ResponseEntity.ok(alertService.listForCurrentCreator(unreadOnly, page, size));
    }

    @PostMapping("/alerts/{id}/read")
    @Operation(summary = "Marca um alerta como lido")
    public ResponseEntity<AlertResponse> markAlertRead(@PathVariable UUID id) {
        return ResponseEntity.ok(alertService.markAsRead(id));
    }

    @PostMapping("/evaluate")
    @Operation(summary = "Reavalia as regras de retenção do criador agora")
    public ResponseEntity<List<AlertResponse>> evaluateNow() {
        UUID creatorId = creatorId();
        List<AlertResponse> created = ruleEngine.evaluateCreator(creatorId).stream()
                .map(AlertResponse::fromEntity)
                .toList();
        return ResponseEntity.ok(created);
    }
}
