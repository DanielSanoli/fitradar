package com.sanoli.fitradar.dto;

public record PushConfigResponse(
        boolean enabled,
        String publicKey
) {
}
