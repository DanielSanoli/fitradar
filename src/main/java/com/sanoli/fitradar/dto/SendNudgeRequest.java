package com.sanoli.fitradar.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SendNudgeRequest(
        @NotBlank(message = "message é obrigatório")
        @Size(min = 1, max = 4000, message = "message deve ter entre 1 e 4000 caracteres")
        String message
) {
}
