package com.sanoli.fitradar.dto;

/**
 * Resposta do reenvio de convite: nova senha temporária e status do e-mail.
 */
public record StudentResendInviteResponse(
        String temporaryPassword,
        boolean emailSent
) {
}
