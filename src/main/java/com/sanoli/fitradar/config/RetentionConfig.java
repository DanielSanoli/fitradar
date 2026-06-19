package com.sanoli.fitradar.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Clock;
import java.time.ZoneId;

@Configuration
public class RetentionConfig {

    @Bean
    public Clock retentionClock(RetentionProperties retentionProperties) {
        return Clock.system(ZoneId.of(retentionProperties.getTimezone()));
    }
}
