package com.sanoli.fitradar.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class LoggingEmailService implements EmailService {

    private static final Logger log = LoggerFactory.getLogger(LoggingEmailService.class);

    @Override
    public void sendPasswordResetEmail(String email, String resetUrl) {
        log.info("[email:reset] conta {} link {}", maskEmail(email), resetUrl);
    }

    @Override
    public void sendEmailVerification(String email, String verificationUrl) {
        log.info("[email:verify] conta {} link {}", maskEmail(email), verificationUrl);
    }

    @Override
    public void sendStudentInvite(String email, String creatorName, String inviteUrl, String tempPassword) {
        log.info("[email:invite] conta {} criador {} link {} senha-temp {}", maskEmail(email), creatorName, inviteUrl, tempPassword);
    }

    @Override
    public void sendWeeklyDigest(String email, String subject, String body) {
        log.info("[email:digest] conta {} assunto {} corpo {}", maskEmail(email), subject, body);
    }

    @Override
    public void sendStudentNudge(String email, String subject, String body) {
        log.info("[email:nudge] conta {} assunto {} corpo {}", maskEmail(email), subject, body);
    }

    private String maskEmail(String email) {
        if (email == null || !email.contains("@")) {
            return "***";
        }
        return "*" + email.substring(email.indexOf('@'));
    }
}
