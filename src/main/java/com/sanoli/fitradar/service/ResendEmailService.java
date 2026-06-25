package com.sanoli.fitradar.service;

import com.resend.Resend;
import com.resend.services.emails.model.CreateEmailOptions;
import com.sanoli.fitradar.config.MailProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class ResendEmailService implements EmailService {

    private static final Logger log = LoggerFactory.getLogger(ResendEmailService.class);

    private final Resend resend;
    private final MailProperties mailProperties;

    public ResendEmailService(MailProperties mailProperties) {
        this(new Resend(mailProperties.getApiKey()), mailProperties);
    }

    ResendEmailService(Resend resend, MailProperties mailProperties) {
        this.resend = resend;
        this.mailProperties = mailProperties;
    }

    @Override
    public void sendPasswordResetEmail(String email, String resetUrl) {
        send(email, "Redefina sua senha no FitRadar", """
                Olá,

                Recebemos um pedido para redefinir sua senha no FitRadar.
                Acesse o link abaixo para continuar (válido por tempo limitado):

                %s

                Se você não solicitou isso, ignore este e-mail.
                """.formatted(resetUrl));
    }

    @Override
    public void sendEmailVerification(String email, String verificationUrl) {
        send(email, "Confirme seu e-mail no FitRadar", """
                Olá,

                Bem-vindo(a) ao FitRadar! Confirme seu e-mail para ativar sua conta:

                %s

                Se você não criou esta conta, ignore este e-mail.
                """.formatted(verificationUrl));
    }

    @Override
    public void sendStudentInvite(String email, String creatorName, String inviteUrl, String tempPassword) {
        send(email, creatorName + " convidou você para treinar no FitRadar", """
                Olá,

                %s convidou você para a comunidade fitness dele(a) no FitRadar.
                Acesse o link abaixo e use a senha temporária para entrar:

                Link: %s
                Senha temporária: %s

                Recomendamos trocar a senha após o primeiro acesso.
                """.formatted(creatorName, inviteUrl, tempPassword));
    }

    @Override
    public void sendWeeklyDigest(String email, String subject, String body) {
        send(email, subject, body);
    }

    @Override
    public boolean sendStudentNudge(String email, String subject, String body) {
        return send(email, subject, body);
    }

    private boolean send(String to, String subject, String text) {
        try {
            CreateEmailOptions params = CreateEmailOptions.builder()
                    .from(mailProperties.getFrom())
                    .to(to)
                    .subject(subject)
                    .text(text)
                    .build();
            resend.emails().send(params);
            log.info("E-mail enviado via Resend para conta terminando em {}", maskEmail(to));
            return true;
        } catch (Exception exception) {
            log.warn("Falha ao enviar e-mail via Resend para conta terminando em {} — {}",
                    maskEmail(to), exception.getMessage());
            return false;
        }
    }

    private String maskEmail(String email) {
        if (email == null || !email.contains("@")) {
            return "***";
        }
        return "*" + email.substring(email.indexOf('@'));
    }
}
