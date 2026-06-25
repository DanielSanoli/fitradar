package com.sanoli.fitradar.dto;

import com.sanoli.fitradar.domain.NudgeDelivery;

import java.util.UUID;

public record SendNudgeResponse(
        UUID deliveryId,
        UUID studentId,
        boolean emailSent,
        boolean pushSent,
        String emailDetail,
        String pushDetail,
        String summary
) {
    public static SendNudgeResponse fromEntity(NudgeDelivery delivery, String summary) {
        return new SendNudgeResponse(
                delivery.getId(),
                delivery.getStudentId(),
                delivery.isEmailSent(),
                delivery.isPushSent(),
                delivery.getEmailDetail(),
                delivery.getPushDetail(),
                summary
        );
    }
}
