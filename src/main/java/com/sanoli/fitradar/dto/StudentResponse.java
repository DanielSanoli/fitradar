package com.sanoli.fitradar.dto;

import com.sanoli.fitradar.domain.AppUser;

import java.time.LocalDateTime;
import java.util.UUID;

public record StudentResponse(
        UUID id,
        String name,
        String email,
        boolean emailVerified,
        LocalDateTime createdAt
) {
    public static StudentResponse fromEntity(AppUser user) {
        return new StudentResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.isEmailVerified(),
                user.getCreatedAt()
        );
    }
}
