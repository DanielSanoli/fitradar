package com.sanoli.fitradar.dto;

import jakarta.validation.constraints.NotBlank;

public record CopilotAskRequest(
        @NotBlank(message = "question é obrigatório")
        String question
) {
}
