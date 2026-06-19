package com.sanoli.fitradar.retention.ai;

import com.sanoli.fitradar.retention.engine.ChurnRiskResult;
import com.sanoli.fitradar.retention.engine.CreatorOverviewResult;
import com.sanoli.fitradar.retention.engine.StudentProgressResult;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Compõe respostas humanas a partir dos DTOs do motor (Regra de Ouro: só usa números do DTO).
 * Toda resposta termina com ação + premissas + disclaimer.
 */
public final class RetentionAnswerComposer {

    public static final String DISCLAIMER = "Sugestão, não orientação médica/profissional.";

    public static final String CREATOR_UNSUPPORTED_MESSAGE = """
            Não identifiquei uma pergunta suportada. Posso ajudar com:
            - Quais alunos estão em risco de desistir?
            - Como está minha comunidade (visão geral)?
            - Me dê uma mensagem para reativar um aluno (use o botão de nudge no aluno).

            """ + DISCLAIMER;

    public static final String STUDENT_UNSUPPORTED_MESSAGE = """
            Não identifiquei uma pergunta suportada. Posso ajudar com:
            - Como está meu progresso? (aderência, streak, próximo treino)

            """ + DISCLAIMER;

    private RetentionAnswerComposer() {
    }

    public static String composeStudentsAtRisk(List<ChurnRiskResult> atRisk) {
        if (atRisk.isEmpty()) {
            return """
                    Nenhum aluno em risco no momento. 🎉

                    Ação sugerida: mantenha o acompanhamento semanal e celebre os streaks dos alunos engajados.
                    Premissas: avaliação de risco com base em inatividade e queda de aderência.

                    %s""".formatted(DISCLAIMER);
        }

        String top = atRisk.stream()
                .limit(3)
                .map(r -> String.format("%s (risco %s, score %d)", r.studentName(), r.level(), r.score()))
                .collect(Collectors.joining("; "));

        String assumptions = atRisk.stream()
                .limit(3)
                .flatMap(r -> r.assumptions().stream())
                .distinct()
                .collect(Collectors.joining("; "));

        return """
                Há %d aluno(s) em risco. Principais: %s.

                Ação sugerida: fale hoje com os alunos de risco ALTO e envie um lembrete aos demais.
                Premissas: %s

                %s""".formatted(
                atRisk.size(),
                top,
                assumptions.isBlank() ? "sem premissas adicionais" : assumptions,
                DISCLAIMER
        );
    }

    public static String composeCreatorOverview(CreatorOverviewResult overview) {
        String adherence = overview.avgAdherence() != null ? overview.avgAdherence().toPlainString() + "%" : "sem dados";
        return """
                Sua comunidade tem %d aluno(s) ativo(s), aderência média de %s e %d aluno(s) em risco.
                Esta semana: %d check-in(s) e %d novo(s) aluno(s).

                Ação sugerida: priorize os alunos em risco e reconheça quem está consistente.
                Premissas: %s

                %s""".formatted(
                overview.activeStudents(),
                adherence,
                overview.atRiskCount(),
                overview.checkInsThisWeek(),
                overview.newStudentsThisWeek(),
                joinAssumptions(overview.assumptions()),
                DISCLAIMER
        );
    }

    public static String composeStudentProgress(StudentProgressResult progress) {
        if (!progress.enrolled()) {
            return """
                    %s

                    Ação sugerida: peça ao seu criador para te matricular em um programa.
                    Premissas: %s

                    %s""".formatted(progress.message(), joinAssumptions(progress.assumptions()), DISCLAIMER);
        }

        String adherence = progress.adherence() != null ? progress.adherence().toPlainString() + "%" : "sem dados ainda";
        String next = progress.nextWorkoutTitle() != null ? progress.nextWorkoutTitle() : "—";
        return """
                Sua aderência (30 dias) é %s, com streak de %d dia(s) e %d treino(s) na última semana.
                Próximo treino: %s.

                Ação sugerida: faça o próximo treino hoje para manter o ritmo.
                Premissas: %s

                %s""".formatted(
                adherence,
                progress.currentStreak(),
                progress.weeklyDone(),
                next,
                joinAssumptions(progress.assumptions()),
                DISCLAIMER
        );
    }

    public static String appendGuardrails(String answer, List<String> assumptions) {
        if (answer == null || answer.isBlank()) {
            return CREATOR_UNSUPPORTED_MESSAGE;
        }
        if (answer.contains(DISCLAIMER)) {
            return answer;
        }
        return answer.strip() + "\n\nPremissas: " + joinAssumptions(assumptions) + "\n\n" + DISCLAIMER;
    }

    private static String joinAssumptions(List<String> assumptions) {
        if (assumptions == null || assumptions.isEmpty()) {
            return "sem premissas adicionais";
        }
        return assumptions.stream().distinct().collect(Collectors.joining("; "));
    }
}
