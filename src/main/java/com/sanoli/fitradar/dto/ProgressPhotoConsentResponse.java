package com.sanoli.fitradar.dto;

import java.time.Instant;

public record ProgressPhotoConsentResponse(
        boolean consented,
        Instant consentedAt
) {
}
