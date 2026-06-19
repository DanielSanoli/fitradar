package com.sanoli.fitradar.retention.engine;

import java.math.BigDecimal;
import java.util.List;

/**
 * Resultado de aderência num período. {@code rate} é null quando não há treinos previstos
 * (aluno sem matrícula no período).
 */
public record AdherenceResult(
        BigDecimal rate,       // 0..100 ou null
        long expected,
        long done,
        List<String> assumptions
) {
}
