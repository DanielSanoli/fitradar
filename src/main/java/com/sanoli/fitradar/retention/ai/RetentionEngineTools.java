package com.sanoli.fitradar.retention.ai;

import com.sanoli.fitradar.domain.RiskLevel;
import com.sanoli.fitradar.retention.engine.ChurnRiskResult;
import com.sanoli.fitradar.retention.engine.CreatorOverviewResult;
import com.sanoli.fitradar.retention.engine.RetentionEngineService;
import com.sanoli.fitradar.retention.engine.StudentProgressResult;
import com.sanoli.fitradar.security.CurrentUserService;
import com.sanoli.fitradar.service.StudentService;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

/**
 * Ferramentas expostas ao copiloto (function calling). Todo número vem do motor.
 */
@Component
public class RetentionEngineTools {

    private final RetentionEngineService engine;
    private final NudgeService nudgeService;
    private final StudentService studentService;
    private final CurrentUserService currentUserService;
    private final RetentionToolInvocationContext invocationContext;

    public RetentionEngineTools(
            RetentionEngineService engine,
            NudgeService nudgeService,
            StudentService studentService,
            CurrentUserService currentUserService,
            RetentionToolInvocationContext invocationContext
    ) {
        this.engine = engine;
        this.nudgeService = nudgeService;
        this.studentService = studentService;
        this.currentUserService = currentUserService;
        this.invocationContext = invocationContext;
    }

    @Tool(description = "Lista os alunos do criador em risco de desistência (churn), com score e nível.")
    public List<ChurnRiskResult> studentsAtRisk() {
        UUID creatorId = currentUserService.requireCreator().getId();
        List<ChurnRiskResult> result = engine.studentsAtRisk(creatorId, RiskLevel.MEDIUM);
        invocationContext.record("studentsAtRisk", result);
        return result;
    }

    @Tool(description = "Retorna a visão geral da comunidade do criador: alunos ativos, aderência média, em risco, check-ins e novos alunos da semana.")
    public CreatorOverviewResult creatorOverview() {
        UUID creatorId = currentUserService.requireCreator().getId();
        CreatorOverviewResult result = engine.creatorOverview(creatorId);
        invocationContext.record("creatorOverview", result);
        return result;
    }

    @Tool(description = "Gera uma mensagem empática de reativação (nudge) para o criador enviar a um aluno específico.")
    public NudgeSuggestion suggestNudge(
            @ToolParam(description = "ID do aluno (UUID)") String studentId
    ) {
        UUID creatorId = currentUserService.requireCreator().getId();
        UUID parsed = UUID.fromString(studentId);
        studentService.requireStudent(creatorId, parsed);
        NudgeSuggestion result = nudgeService.buildNudge(parsed);
        invocationContext.record("suggestNudge", result);
        return result;
    }

    @Tool(description = "Retorna o progresso do aluno autenticado: aderência, streak, próximo treino e treinos da semana.")
    public StudentProgressResult studentProgress() {
        UUID studentId = currentUserService.requireStudent().getId();
        StudentProgressResult result = engine.studentProgress(studentId);
        invocationContext.record("studentProgress", result);
        return result;
    }
}
