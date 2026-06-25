package com.sanoli.fitradar.retention.ai;

import com.sanoli.fitradar.config.MailProperties;
import com.sanoli.fitradar.domain.AppUser;
import com.sanoli.fitradar.domain.NudgeDelivery;
import com.sanoli.fitradar.dto.SendNudgeResponse;
import com.sanoli.fitradar.exception.BusinessException;
import com.sanoli.fitradar.repository.NudgeDeliveryRepository;
import com.sanoli.fitradar.repository.UserRepository;
import com.sanoli.fitradar.service.EmailService;
import com.sanoli.fitradar.service.PushNotificationService;
import com.sanoli.fitradar.service.StudentService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Entrega manual de nudge (criador → aluno) por e-mail e/ou push, com registro.
 */
@Service
public class StudentNudgeDeliveryService {

    private static final String EMAIL_SUBJECT = "Mensagem do seu coach 💪";

    private final StudentService studentService;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final MailProperties mailProperties;
    private final PushNotificationService pushNotificationService;
    private final NudgeDeliveryRepository nudgeDeliveryRepository;
    private final String publicBaseUrl;

    public StudentNudgeDeliveryService(
            StudentService studentService,
            UserRepository userRepository,
            EmailService emailService,
            MailProperties mailProperties,
            PushNotificationService pushNotificationService,
            NudgeDeliveryRepository nudgeDeliveryRepository,
            @Value("${app.public-base-url:http://localhost:8080}") String publicBaseUrl
    ) {
        this.studentService = studentService;
        this.userRepository = userRepository;
        this.emailService = emailService;
        this.mailProperties = mailProperties;
        this.pushNotificationService = pushNotificationService;
        this.nudgeDeliveryRepository = nudgeDeliveryRepository;
        this.publicBaseUrl = publicBaseUrl;
    }

    @Transactional
    public SendNudgeResponse send(UUID creatorId, UUID studentId, String message) {
        String trimmed = message == null ? "" : message.trim();
        if (trimmed.isEmpty()) {
            throw new BusinessException("A mensagem do lembrete não pode estar vazia.");
        }

        AppUser student = studentService.requireStudent(creatorId, studentId);
        AppUser creator = userRepository.findById(creatorId)
                .orElseThrow(() -> new BusinessException("Criador não encontrado."));

        EmailAttempt emailAttempt = deliverEmail(student, creator, trimmed);
        PushAttempt pushAttempt = deliverPush(student, trimmed);

        if (!emailAttempt.sent() && !pushAttempt.sent()) {
            throw new BusinessException(buildFailureMessage(emailAttempt.detail(), pushAttempt.detail()));
        }

        NudgeDelivery delivery = new NudgeDelivery();
        delivery.setCreatorId(creatorId);
        delivery.setStudentId(studentId);
        delivery.setMessage(trimmed);
        delivery.setEmailSent(emailAttempt.sent());
        delivery.setPushSent(pushAttempt.sent());
        delivery.setEmailDetail(emailAttempt.detail());
        delivery.setPushDetail(pushAttempt.detail());
        nudgeDeliveryRepository.save(delivery);

        return SendNudgeResponse.fromEntity(delivery, buildSummary(emailAttempt, pushAttempt));
    }

    private EmailAttempt deliverEmail(AppUser student, AppUser creator, String message) {
        if (student.getEmail() == null || student.getEmail().isBlank()) {
            return new EmailAttempt(false, "Aluno sem e-mail cadastrado.");
        }

        String body = buildEmailBody(message, creator.getName());
        boolean sent = emailService.sendStudentNudge(student.getEmail(), EMAIL_SUBJECT, body);
        if (sent) {
            String detail = mailProperties.isEnabled()
                    ? "E-mail enviado para " + maskEmail(student.getEmail()) + "."
                    : "E-mail registrado (Resend não configurado — modo desenvolvimento).";
            return new EmailAttempt(true, detail);
        }
        return new EmailAttempt(false, "Falha ao enviar e-mail para " + maskEmail(student.getEmail()) + ".");
    }

    private PushAttempt deliverPush(AppUser student, String message) {
        if (!pushNotificationService.isEnabled()) {
            return new PushAttempt(false, "Push não configurado no servidor.");
        }
        if (!pushNotificationService.hasSubscription(student.getId())) {
            return new PushAttempt(false, "Aluno sem notificações push ativas.");
        }

        pushNotificationService.sendToUser(
                student.getId(),
                EMAIL_SUBJECT,
                message,
                "/student"
        );
        return new PushAttempt(true, "Notificação push enviada.");
    }

    private String buildEmailBody(String message, String creatorName) {
        String base = publicBaseUrl.replaceAll("/$", "");
        return message + "\n\n— " + creatorName
                + "\n\nAcesse seus treinos: " + base + "/student"
                + "\n\nSugestão, não orientação médica/profissional.";
    }

    private static String buildFailureMessage(String emailDetail, String pushDetail) {
        return "Não foi possível entregar o lembrete. E-mail: "
                + emailDetail + " Push: " + pushDetail;
    }

    private static String buildSummary(EmailAttempt email, PushAttempt push) {
        List<String> parts = new ArrayList<>();
        if (email.sent()) {
            parts.add("e-mail");
        }
        if (push.sent()) {
            parts.add("push");
        }
        String channels = String.join(" e ", parts);
        if (email.sent() && push.sent()) {
            return "Lembrete enviado por e-mail e push.";
        }
        if (email.sent()) {
            return "Lembrete enviado por e-mail. Push: " + push.detail();
        }
        return "Lembrete enviado por push. E-mail: " + email.detail();
    }

    private static String maskEmail(String email) {
        if (email == null || !email.contains("@")) {
            return "***";
        }
        return "*" + email.substring(email.indexOf('@'));
    }

    private record EmailAttempt(boolean sent, String detail) {
    }

    private record PushAttempt(boolean sent, String detail) {
    }
}
