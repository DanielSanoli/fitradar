package com.sanoli.fitradar.dto;

import com.sanoli.fitradar.domain.ProgressPhoto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record ProgressPhotoResponse(
        UUID id,
        LocalDate date,
        String note,
        BigDecimal weight,
        boolean sharedWithCoach,
        Instant createdAt
) {
    public static ProgressPhotoResponse fromEntity(ProgressPhoto photo) {
        return new ProgressPhotoResponse(
                photo.getId(),
                photo.getPhotoDate(),
                photo.getNote(),
                photo.getWeight(),
                photo.isSharedWithCoach(),
                photo.getCreatedAt()
        );
    }
}
