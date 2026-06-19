package com.sanoli.fitradar.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record StudentInviteRequest(
        @NotBlank(message = "name é obrigatório")
        String name,

        @NotBlank(message = "email é obrigatório")
        @Email(message = "email deve ser válido")
        String email
) {
}
