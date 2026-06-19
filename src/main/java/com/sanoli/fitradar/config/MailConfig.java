package com.sanoli.fitradar.config;

import com.sanoli.fitradar.service.EmailService;
import com.sanoli.fitradar.service.LoggingEmailService;
import com.sanoli.fitradar.service.ResendEmailService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class MailConfig {

    @Bean
    EmailService emailService(MailProperties mailProperties) {
        if (mailProperties.isEnabled()) {
            return new ResendEmailService(mailProperties);
        }
        return new LoggingEmailService();
    }
}
