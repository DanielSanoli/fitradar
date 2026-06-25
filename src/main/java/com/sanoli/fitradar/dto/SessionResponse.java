package com.sanoli.fitradar.dto;

import com.sanoli.fitradar.domain.RefreshToken;

import java.time.LocalDateTime;
import java.util.UUID;

public record SessionResponse(
        UUID id,
        String deviceLabel,
        String ipAddress,
        LocalDateTime createdAt,
        LocalDateTime expiresAt,
        boolean current
) {

    public static SessionResponse from(RefreshToken token, boolean current) {
        return new SessionResponse(
                token.getId(),
                SessionDeviceLabel.fromUserAgent(token.getUserAgent()),
                token.getIpAddress(),
                token.getCreatedAt(),
                token.getExpiresAt(),
                current
        );
    }
}
