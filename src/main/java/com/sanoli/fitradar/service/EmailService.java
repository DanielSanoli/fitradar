package com.sanoli.fitradar.service;

public interface EmailService {

    void sendPasswordResetEmail(String email, String resetUrl);

    void sendEmailVerification(String email, String verificationUrl);

    void sendStudentInvite(String email, String creatorName, String inviteUrl, String tempPassword);

    void sendWeeklyDigest(String email, String subject, String body);

    void sendStudentNudge(String email, String subject, String body);
}
