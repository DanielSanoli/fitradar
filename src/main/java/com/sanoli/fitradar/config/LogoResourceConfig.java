package com.sanoli.fitradar.config;

import com.sanoli.fitradar.service.LogoStorageService;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;

@Configuration
public class LogoResourceConfig implements WebMvcConfigurer {

    private final LogoStorageProperties logoStorageProperties;

    public LogoResourceConfig(LogoStorageProperties logoStorageProperties) {
        this.logoStorageProperties = logoStorageProperties;
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String location = Path.of(logoStorageProperties.getDirectory()).toAbsolutePath().normalize().toUri().toString();
        registry.addResourceHandler(LogoStorageService.PUBLIC_PREFIX + "**")
                .addResourceLocations(location.endsWith("/") ? location : location + "/")
                .setCachePeriod(3600);
    }
}
