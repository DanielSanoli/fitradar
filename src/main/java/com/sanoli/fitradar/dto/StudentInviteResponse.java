package com.sanoli.fitradar.dto;

import java.util.UUID;

/**
 * Resposta do convite: inclui a senha temporária para o criador repassar
 * (também enviada por e-mail quando o Resend está configurado).
 */
public record StudentInviteResponse(
        UUID studentId,
        String name,
        String email,
        String temporaryPassword
) {
}
