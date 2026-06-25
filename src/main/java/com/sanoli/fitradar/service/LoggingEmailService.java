package com.sanoli.fitradar.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class LoggingEmailService implements EmailService {

    private static final Logger log = LoggerFactory.getLogger(LoggingEmailService.class);

    @Override
    public void sendPasswordResetEmail(String email, String resetUrl) {
        log.info("[email:reset] enviado para conta {} (link omitido nos logs)", maskEmail(email));
    }

    @Override
    public void sendEmailVerification(String email, String verificationUrl) {
        log.info("[email:verify] enviado para conta {} (link omitido nos logs)", maskEmail(email));
    }

    @Override
    public void sendStudentInvite(String email, String creatorName, String inviteUrl, String tempPassword) {
        log.info("[email:invite] enviado para conta {} criador {} (credenciais omitidas nos logs)",
                maskEmail(email), creatorName);
    }

    @Override
    public void sendWeeklyDigest(String email, String subject, String body) {
        log.info("[email:digest] enviado para conta {} assunto {}", maskEmail(email), subject);
    }

    @Override
    public boolean sendStudentNudge(String email, String subject, String body) {
        log.info("[email:nudge] enviado para conta {} assunto {}", maskEmail(email), subject);
        return true;
    }

    private String maskEmail(String email) {
        if (email == null || !email.contains("@")) {
            return "***";
        }
        return "*" + email.substring(email.indexOf('@'));
    }
}
