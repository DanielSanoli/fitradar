package com.sanoli.fitradar.dto;

public record CopilotAskResponse(
        String answer,
        String usedFunction,
        Object data
) {
}
