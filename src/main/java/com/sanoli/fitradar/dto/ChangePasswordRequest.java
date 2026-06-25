package com.sanoli.fitradar.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChangePasswordRequest(
        /** Obrigatório exceto quando mustChangePassword=true (convite). */
        String currentPassword,

        @NotBlank(message = "newPassword é obrigatório")
        @Size(min = 8, message = "newPassword deve ter pelo menos 8 caracteres")
        String newPassword
) {
}
