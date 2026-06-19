package com.sanoli.fitradar.retention.ai;

import com.sanoli.fitradar.domain.AppUser;
import com.sanoli.fitradar.repository.UserRepository;
import com.sanoli.fitradar.retention.engine.RetentionEngineService;
import com.sanoli.fitradar.retention.engine.StudentProgressResult;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Compõe um nudge (mensagem de reativação) empático para o criador enviar ao aluno.
 * Todo número vem do motor (Regra de Ouro).
 */
@Service
public class NudgeService {

    private final RetentionEngineService engine;
    private final UserRepository userRepository;

    public NudgeService(RetentionEngineService engine, UserRepository userRepository) {
        this.engine = engine;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public NudgeSuggestion buildNudge(UUID studentId) {
        AppUser student = userRepository.findById(studentId).orElse(null);
        String name = student != null ? student.getName() : "aluno";
        String firstName = name.split(" ")[0];

        Long daysInactive = engine.daysSinceLastActivity(studentId);
        StudentProgressResult progress = engine.studentProgress(studentId);

        List<String> assumptions = new ArrayList<>();
        StringBuilder message = new StringBuilder();
        message.append("Oi, ").append(firstName).append("! ");

        if (daysInactive != null && daysInactive > 0) {
            message.append("Senti sua falta nos treinos — vi que faz ")
                    .append(daysInactive)
                    .append(" dia(s) desde seu último check-in. ");
            assumptions.add("Inativo há " + daysInactive + " dia(s)");
        } else {
            message.append("Que bom te ver por aqui! Bora manter o ritmo dos treinos. ");
            assumptions.add("Sem registro recente de inatividade prolongada");
        }

        if (progress.enrolled() && progress.nextWorkoutTitle() != null) {
            message.append("Seu próximo treino é \"")
                    .append(progress.nextWorkoutTitle())
                    .append("\" — que tal fazer ele hoje? ");
            assumptions.add("Próximo treino sugerido: " + progress.nextWorkoutTitle());
        }

        if (progress.enrolled() && progress.currentStreak() > 0) {
            message.append("Você já tem um streak de ").append(progress.currentStreak())
                    .append(" dia(s), seria uma pena perder! ");
            assumptions.add("Streak atual: " + progress.currentStreak() + " dia(s)");
        }

        message.append("Tô aqui pra te ajudar a voltar com tudo. 💪");

        return new NudgeSuggestion(studentId, name, message.toString(), assumptions);
    }
}
