package com.sanoli.fitradar.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record DeleteAccountRequest(
        @NotBlank(message = "Confirme seu e-mail")
        @Email(message = "E-mail inválido")
        String confirmEmail
) {
}
