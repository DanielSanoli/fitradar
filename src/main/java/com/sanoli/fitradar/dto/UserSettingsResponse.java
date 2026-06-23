package com.sanoli.fitradar.dto;

import com.sanoli.fitradar.domain.DigestFrequency;
import com.sanoli.fitradar.domain.UserSettings;

import java.util.UUID;

public record UserSettingsResponse(
        UUID userId,
        DigestFrequency digestFrequency
) {
    public static UserSettingsResponse fromEntity(UserSettings settings) {
        return new UserSettingsResponse(settings.getUserId(), settings.getDigestFrequency());
    }

    public static UserSettingsResponse defaults(UUID userId) {
        return new UserSettingsResponse(userId, DigestFrequency.WEEKLY);
    }
}
