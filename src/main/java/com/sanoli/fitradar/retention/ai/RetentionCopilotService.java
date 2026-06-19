package com.sanoli.fitradar.retention.ai;

import com.sanoli.fitradar.config.CopilotProperties;
import com.sanoli.fitradar.domain.UserRole;
import com.sanoli.fitradar.dto.CopilotAskResponse;
import com.sanoli.fitradar.exception.BusinessException;
import com.sanoli.fitradar.retention.engine.ChurnRiskResult;
import com.sanoli.fitradar.retention.engine.CreatorOverviewResult;
import com.sanoli.fitradar.retention.engine.StudentProgressResult;
import com.sanoli.fitradar.security.CurrentUserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;

@Service
public class RetentionCopilotService {

    private static final Logger log = LoggerFactory.getLogger(RetentionCopilotService.class);

    private static final String SYSTEM_PROMPT = """
            Você é o copiloto de retenção do FitRadar, para criadores fitness e seus alunos.
            Regras obrigatórias:
            1. Nunca invente números (aderência, dias de inatividade, risco). Use apenas o que as ferramentas retornarem.
            2. Sempre termine com: uma ação prática + as premissas (campo assumptions do DTO) + a frase exata: Sugestão, não orientação médica/profissional.
            3. Se a pergunta não corresponder a nenhuma ferramenta, liste o que pode ser perguntado, sem inventar números.
            4. Responda em português do Brasil, de forma direta e empática.
            Ferramentas (criador): studentsAtRisk, creatorOverview, suggestNudge.
            Ferramenta (aluno): studentProgress.
            """;

    private static final Set<String> RISK_KEYWORDS = Set.of(
            "risco", "desist", "churn", "abandon", "em risco", "vão sair", "vao sair", "perder aluno"
    );
    private static final Set<String> OVERVIEW_KEYWORDS = Set.of(
            "geral", "visão", "visao", "overview", "painel", "comunidade", "como está", "como esta", "resumo", "panorama"
    );
    private static final Set<String> PROGRESS_KEYWORDS = Set.of(
            "progress", "aderência", "aderencia", "streak", "meu treino", "como estou", "evolu"
    );

    private final RetentionEngineTools tools;
    private final RetentionToolInvocationContext invocationContext;
    private final CurrentUserService currentUserService;
    private final CopilotProperties copilotProperties;
    private final Optional<ChatClient> chatClient;

    public RetentionCopilotService(
            RetentionEngineTools tools,
            RetentionToolInvocationContext invocationContext,
            CurrentUserService currentUserService,
            CopilotProperties copilotProperties,
            ObjectProvider<ChatModel> chatModelProvider,
            ObjectProvider<ChatClient.Builder> chatClientBuilderProvider
    ) {
        this.tools = tools;
        this.invocationContext = invocationContext;
        this.currentUserService = currentUserService;
        this.copilotProperties = copilotProperties;
        this.chatClient = buildChatClient(copilotProperties, chatModelProvider, chatClientBuilderProvider);
    }

    public CopilotAskResponse ask(String question) {
        invocationContext.clear();
        UserRole role = currentUserService.getCurrentUser().getRole();

        if (copilotProperties.isEnabled() && chatClient.isPresent()) {
            try {
                CopilotAskResponse response = askWithSpringAi(question, role);
                log.info("[copilot] outcome=success mode=ai function={}", response.usedFunction());
                return response;
            } catch (RuntimeException exception) {
                log.warn("[copilot] outcome=degraded mode=deterministic reason=ai_failure");
            }
        }

        CopilotAskResponse response = askDeterministic(question, role);
        log.info("[copilot] outcome=success mode=deterministic function={}", response.usedFunction());
        return response;
    }

    private CopilotAskResponse askWithSpringAi(String question, UserRole role) {
        ChatClient client = chatClient.orElseThrow(() -> new BusinessException("Copiloto IA indisponível"));
        String answer = client.prompt()
                .system(SYSTEM_PROMPT)
                .tools(tools)
                .user(question)
                .call()
                .content();

        String usedFunction = invocationContext.getUsedFunction();
        Object data = invocationContext.getData();
        if (usedFunction == null) {
            return new CopilotAskResponse(
                    answer != null ? answer : unsupportedMessage(role),
                    "unsupported",
                    null
            );
        }
        return new CopilotAskResponse(answer, usedFunction, data);
    }

    private CopilotAskResponse askDeterministic(String question, UserRole role) {
        String normalized = question.toLowerCase(Locale.ROOT);

        if (role == UserRole.STUDENT) {
            if (matchesAny(normalized, PROGRESS_KEYWORDS)) {
                StudentProgressResult result = tools.studentProgress();
                return new CopilotAskResponse(
                        RetentionAnswerComposer.composeStudentProgress(result), "studentProgress", result);
            }
            return new CopilotAskResponse(RetentionAnswerComposer.STUDENT_UNSUPPORTED_MESSAGE, "unsupported", null);
        }

        // CREATOR / ADMIN
        if (matchesAny(normalized, RISK_KEYWORDS)) {
            List<ChurnRiskResult> result = tools.studentsAtRisk();
            return new CopilotAskResponse(
                    RetentionAnswerComposer.composeStudentsAtRisk(result), "studentsAtRisk", result);
        }
        if (matchesAny(normalized, OVERVIEW_KEYWORDS)) {
            CreatorOverviewResult result = tools.creatorOverview();
            return new CopilotAskResponse(
                    RetentionAnswerComposer.composeCreatorOverview(result), "creatorOverview", result);
        }
        return new CopilotAskResponse(RetentionAnswerComposer.CREATOR_UNSUPPORTED_MESSAGE, "unsupported", null);
    }

    private String unsupportedMessage(UserRole role) {
        return role == UserRole.STUDENT
                ? RetentionAnswerComposer.STUDENT_UNSUPPORTED_MESSAGE
                : RetentionAnswerComposer.CREATOR_UNSUPPORTED_MESSAGE;
    }

    private static Optional<ChatClient> buildChatClient(
            CopilotProperties copilotProperties,
            ObjectProvider<ChatModel> chatModelProvider,
            ObjectProvider<ChatClient.Builder> chatClientBuilderProvider
    ) {
        if (!copilotProperties.isEnabled()) {
            return Optional.empty();
        }
        ChatModel chatModel = chatModelProvider.getIfAvailable();
        if (chatModel == null) {
            return Optional.empty();
        }
        ChatClient.Builder builder = chatClientBuilderProvider.getIfAvailable();
        if (builder != null) {
            return Optional.of(builder.build());
        }
        return Optional.of(ChatClient.builder(chatModel).build());
    }

    private static boolean matchesAny(String text, Set<String> keywords) {
        return keywords.stream().anyMatch(text::contains);
    }
}
