package com.sanoli.fitradar.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
        @NotBlank(message = "name é obrigatório")
        @Size(max = 120, message = "name deve ter no máximo 120 caracteres")
        String name,

        @NotBlank(message = "email é obrigatório")
        @Email(message = "email deve ser válido")
        String email
) {
}
