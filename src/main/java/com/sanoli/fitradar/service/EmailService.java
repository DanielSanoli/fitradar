package com.sanoli.fitradar.service;

public interface EmailService {

    void sendPasswordResetEmail(String email, String resetUrl);

    void sendEmailVerification(String email, String verificationUrl);

    void sendStudentInvite(String email, String creatorName, String inviteUrl, String tempPassword);

    void sendWeeklyDigest(String email, String subject, String body);

    /** @return true se o provedor aceitou o envio (ou modo dev/log). */
    boolean sendStudentNudge(String email, String subject, String body);
}
