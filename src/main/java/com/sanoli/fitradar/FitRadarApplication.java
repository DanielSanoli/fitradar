package com.sanoli.fitradar;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@ConfigurationPropertiesScan
@EnableScheduling
public class FitRadarApplication {

    public static void main(String[] args) {
        SpringApplication.run(FitRadarApplication.class, args);
    }
}
