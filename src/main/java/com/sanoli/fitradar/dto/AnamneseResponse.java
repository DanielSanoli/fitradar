package com.sanoli.fitradar.dto;

import com.sanoli.fitradar.domain.Anamnese;
import com.sanoli.fitradar.domain.ExperienciaTreino;
import com.sanoli.fitradar.domain.NivelAtividadeRotina;
import com.sanoli.fitradar.domain.ObjetivoPrincipal;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record AnamneseResponse(
        UUID id,
        UUID studentId,
        UUID creatorId,
        ObjetivoPrincipal objetivoPrincipal,
        ExperienciaTreino experienciaTreino,
        int diasDisponiveisSemana,
        NivelAtividadeRotina nivelAtividadeRotina,
        int alturaCm,
        BigDecimal pesoAtualKg,
        BigDecimal pesoObjetivoKg,
        String historicoLesoes,
        String condicoesSaude,
        String medicacoes,
        String restricoesAlimentares,
        String observacoes,
        boolean consentimentoDadosSaude,
        Instant createdAt,
        Instant updatedAt
) {
    public static AnamneseResponse fromEntity(Anamnese entity) {
        return new AnamneseResponse(
                entity.getId(),
                entity.getStudentId(),
                entity.getCreatorId(),
                entity.getObjetivoPrincipal(),
                entity.getExperienciaTreino(),
                entity.getDiasDisponiveisSemana(),
                entity.getNivelAtividadeRotina(),
                entity.getAlturaCm(),
                entity.getPesoAtualKg(),
                entity.getPesoObjetivoKg(),
                entity.getHistoricoLesoes(),
                entity.getCondicoesSaude(),
                entity.getMedicacoes(),
                entity.getRestricoesAlimentares(),
                entity.getObservacoes(),
                entity.isConsentimentoDadosSaude(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
