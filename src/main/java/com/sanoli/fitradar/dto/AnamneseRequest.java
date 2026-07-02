package com.sanoli.fitradar.dto;

import com.sanoli.fitradar.domain.ExperienciaTreino;
import com.sanoli.fitradar.domain.NivelAtividadeRotina;
import com.sanoli.fitradar.domain.ObjetivoPrincipal;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record AnamneseRequest(
        @NotNull(message = "objetivoPrincipal é obrigatório")
        ObjetivoPrincipal objetivoPrincipal,

        @NotNull(message = "experienciaTreino é obrigatório")
        ExperienciaTreino experienciaTreino,

        @Min(value = 1, message = "diasDisponiveisSemana deve ser entre 1 e 7")
        @Max(value = 7, message = "diasDisponiveisSemana deve ser entre 1 e 7")
        int diasDisponiveisSemana,

        @NotNull(message = "nivelAtividadeRotina é obrigatório")
        NivelAtividadeRotina nivelAtividadeRotina,

        @Min(value = 100, message = "alturaCm deve ser entre 100 e 250")
        @Max(value = 250, message = "alturaCm deve ser entre 100 e 250")
        int alturaCm,

        @NotNull(message = "pesoAtualKg é obrigatório")
        @DecimalMin(value = "20.0", message = "pesoAtualKg inválido")
        @DecimalMax(value = "300.0", message = "pesoAtualKg inválido")
        BigDecimal pesoAtualKg,

        @DecimalMin(value = "20.0", message = "pesoObjetivoKg inválido")
        @DecimalMax(value = "300.0", message = "pesoObjetivoKg inválido")
        BigDecimal pesoObjetivoKg,

        String historicoLesoes,
        String condicoesSaude,
        String medicacoes,
        String restricoesAlimentares,
        String observacoes,

        @NotNull(message = "consentimentoDadosSaude é obrigatório")
        Boolean consentimentoDadosSaude
) {
}
