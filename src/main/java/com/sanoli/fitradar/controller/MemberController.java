package com.sanoli.fitradar.controller;

import com.sanoli.fitradar.domain.AppUser;
import com.sanoli.fitradar.dto.CheckInRequest;
import com.sanoli.fitradar.dto.CheckInResponse;
import com.sanoli.fitradar.dto.CreatorSpaceResponse;
import com.sanoli.fitradar.dto.EnrollmentResponse;
import com.sanoli.fitradar.dto.GamificationProfileResponse;
import com.sanoli.fitradar.dto.LeaderboardEntryResponse;
import com.sanoli.fitradar.dto.PageResponse;
import com.sanoli.fitradar.dto.ProgramCheckoutResponse;
import com.sanoli.fitradar.dto.StudentProgramResponse;
import com.sanoli.fitradar.dto.WorkoutResponse;
import com.sanoli.fitradar.retention.engine.RetentionEngineService;
import com.sanoli.fitradar.retention.engine.StudentProgressResult;
import com.sanoli.fitradar.security.CurrentUserService;
import com.sanoli.fitradar.service.GamificationService;
import com.sanoli.fitradar.service.MarketplaceBillingService;
import com.sanoli.fitradar.service.MemberService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/my")
public class MemberController {

    private final MemberService memberService;
    private final RetentionEngineService retentionEngineService;
    private final MarketplaceBillingService marketplaceBillingService;
    private final GamificationService gamificationService;
    private final CurrentUserService currentUserService;

    public MemberController(
            MemberService memberService,
            RetentionEngineService retentionEngineService,
            MarketplaceBillingService marketplaceBillingService,
            GamificationService gamificationService,
            CurrentUserService currentUserService
    ) {
        this.memberService = memberService;
        this.retentionEngineService = retentionEngineService;
        this.marketplaceBillingService = marketplaceBillingService;
        this.gamificationService = gamificationService;
        this.currentUserService = currentUserService;
    }

    @GetMapping("/space")
    @Operation(summary = "Retorna o espaço do criador do aluno")
    public ResponseEntity<CreatorSpaceResponse> mySpace() {
        AppUser student = currentUserService.requireStudent();
        return memberService.getMySpace(student)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @GetMapping("/workouts")
    @Operation(summary = "Lista os treinos dos programas em que o aluno está matriculado")
    public ResponseEntity<List<WorkoutResponse>> myWorkouts() {
        return ResponseEntity.ok(memberService.getMyWorkouts(currentUserService.requireStudent()));
    }

    @PostMapping("/check-ins")
    @Operation(summary = "Registra um check-in do aluno em um treino")
    public ResponseEntity<CheckInResponse> checkIn(@Valid @RequestBody CheckInRequest request) {
        AppUser student = currentUserService.requireStudent();
        return ResponseEntity.status(HttpStatus.CREATED).body(memberService.checkIn(student, request));
    }

    @GetMapping("/check-ins")
    @Operation(summary = "Lista os check-ins do aluno")
    public ResponseEntity<PageResponse<CheckInResponse>> myCheckIns(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size
    ) {
        return ResponseEntity.ok(memberService.listMyCheckIns(currentUserService.requireStudent(), page, size));
    }

    @GetMapping("/progress")
    @Operation(summary = "Progresso do aluno (aderência, streak, próximo treino)")
    public ResponseEntity<StudentProgressResult> myProgress() {
        return ResponseEntity.ok(retentionEngineService.studentProgress(currentUserService.requireStudent().getId()));
    }

    @GetMapping("/gamification")
    @Operation(summary = "Badges, streak persistido e ranking do aluno")
    public ResponseEntity<GamificationProfileResponse> myGamification() {
        return ResponseEntity.ok(gamificationService.profileForStudent(currentUserService.requireStudent()));
    }

    @GetMapping("/leaderboard")
    @Operation(summary = "Ranking de engajamento da comunidade do criador (visão aluno)")
    public ResponseEntity<List<LeaderboardEntryResponse>> myLeaderboard(
            @RequestParam(name = "limit", defaultValue = "20") int limit
    ) {
        AppUser student = currentUserService.requireStudent();
        if (student.getCreatorId() == null) {
            return ResponseEntity.ok(List.of());
        }
        int safeLimit = Math.max(1, Math.min(limit, 50));
        return ResponseEntity.ok(gamificationService.leaderboard(student.getCreatorId(), safeLimit));
    }

    @GetMapping("/programs")
    @Operation(summary = "Catálogo de programas do criador (gratuitos e pagos)")
    public ResponseEntity<List<StudentProgramResponse>> myPrograms() {
        return ResponseEntity.ok(marketplaceBillingService.catalogForStudent(currentUserService.requireStudent()));
    }

    @PostMapping("/programs/{programId}/enroll")
    @Operation(summary = "Matricula-se em programa gratuito")
    public ResponseEntity<EnrollmentResponse> enrollFree(@PathVariable UUID programId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(
                marketplaceBillingService.enrollFreeProgram(currentUserService.requireStudent(), programId));
    }

    @PostMapping("/programs/{programId}/checkout")
    @Operation(summary = "Inicia checkout de programa pago (split criador + taxa FitRadar)")
    public ResponseEntity<ProgramCheckoutResponse> checkoutProgram(@PathVariable UUID programId) {
        return ResponseEntity.ok(
                marketplaceBillingService.checkoutProgram(currentUserService.requireStudent(), programId));
    }
}
