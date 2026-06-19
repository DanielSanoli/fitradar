package com.sanoli.fitradar.observability;

import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import com.sanoli.fitradar.service.LoggingEmailService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;

import static org.assertj.core.api.Assertions.assertThat;

class SensitiveLoggingTest {

    private ListAppender<ILoggingEvent> appender;

    @BeforeEach
    void setUp() {
        Logger logger = (Logger) LoggerFactory.getLogger(LoggingEmailService.class);
        appender = new ListAppender<>();
        appender.start();
        logger.addAppender(appender);
    }

    @AfterEach
    void tearDown() {
        Logger logger = (Logger) LoggerFactory.getLogger(LoggingEmailService.class);
        logger.detachAppender(appender);
    }

    @Test
    void emailLogsDoNotContainPasswordTokenOrResetUrl() {
        LoggingEmailService service = new LoggingEmailService();
        String tempPassword = "TempSenhaSegura123!";
        String resetUrl = "https://app.fitradar.com/reset?token=eyJhbGciOiJIUzI1NiJ9.secret";

        service.sendStudentInvite("aluno@test.local", "Creator", "https://app.fitradar.com/invite", tempPassword);
        service.sendPasswordResetEmail("aluno@test.local", resetUrl);
        service.sendEmailVerification("aluno@test.local", resetUrl);

        String combined = appender.list.stream()
                .map(ILoggingEvent::getFormattedMessage)
                .reduce("", (a, b) -> a + " " + b);

        assertThat(combined).doesNotContain(tempPassword);
        assertThat(combined).doesNotContain("eyJhbGci");
        assertThat(combined).doesNotContain("https://app.fitradar.com");
        assertThat(LoggingSanitizer.containsSensitivePatterns(combined)).isFalse();
    }
}
