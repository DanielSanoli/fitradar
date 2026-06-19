package com.sanoli.fitradar.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreatorSpaceRequest(
        @NotBlank(message = "name é obrigatório")
        String name,

        @Size(max = 60, message = "slug deve ter no máximo 60 caracteres")
        String slug,

        String logoUrl,

        String primaryColor,

        @Size(max = 1000, message = "bio deve ter no máximo 1000 caracteres")
        String bio
) {
}
