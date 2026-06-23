package com.sanoli.fitradar.dto;

import com.sanoli.fitradar.domain.DigestFrequency;
import jakarta.validation.constraints.NotNull;

public record UserSettingsUpdateRequest(
        @NotNull(message = "digestFrequency é obrigatório")
        DigestFrequency digestFrequency
) {
}
