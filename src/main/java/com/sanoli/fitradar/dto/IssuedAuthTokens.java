package com.sanoli.fitradar.dto;

/**
 * Tokens emitidos no login/refresh — o refresh vai para cookie httpOnly; só o access entra no JSON.
 */
public record IssuedAuthTokens(
        String accessToken,
        String refreshToken,
        UserResponse user
) {
    public AuthResponse toResponse() {
        return AuthResponse.bearer(accessToken, user);
    }
}
