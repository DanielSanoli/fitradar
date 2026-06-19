package com.sanoli.fitradar.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Evita que o Spring AI suba modelos OpenAI (speech, image, etc.) sem API key.
 * Só habilita chat quando {@code app.copilot.enabled=true} e há chave real.
 */
public class CopilotOpenAiEnvironmentPostProcessor implements EnvironmentPostProcessor {

    private static final List<String> NON_CHAT_OPENAI_AUTO_CONFIGS = List.of(
            "org.springframework.ai.model.openai.autoconfigure.OpenAiAudioSpeechAutoConfiguration",
            "org.springframework.ai.model.openai.autoconfigure.OpenAiAudioTranscriptionAutoConfiguration",
            "org.springframework.ai.model.openai.autoconfigure.OpenAiImageAutoConfiguration",
            "org.springframework.ai.model.openai.autoconfigure.OpenAiEmbeddingAutoConfiguration",
            "org.springframework.ai.model.openai.autoconfigure.OpenAiModerationAutoConfiguration"
    );

    private static final String CHAT_AUTO_CONFIG =
            "org.springframework.ai.model.openai.autoconfigure.OpenAiChatAutoConfiguration";

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        Set<String> excludes = new LinkedHashSet<>(parseCsv(environment.getProperty("spring.autoconfigure.exclude")));
        excludes.addAll(NON_CHAT_OPENAI_AUTO_CONFIGS);

        if (!isOpenAiChatEnabled(environment)) {
            excludes.add(CHAT_AUTO_CONFIG);
        }

        environment.getPropertySources().addFirst(new MapPropertySource(
                "fitradarOpenAiAutoConfigurationExcludes",
                Map.of("spring.autoconfigure.exclude", String.join(",", excludes))
        ));
    }

    private boolean isOpenAiChatEnabled(ConfigurableEnvironment environment) {
        if (!environment.getProperty("app.copilot.enabled", Boolean.class, false)) {
            return false;
        }
        String apiKey = firstNonBlank(
                environment.getProperty("OPENAI_API_KEY"),
                environment.getProperty("spring.ai.openai.api-key")
        );
        return apiKey != null && !apiKey.isBlank() && !"sk-noop".equals(apiKey);
    }

    private static String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return null;
    }

    private static List<String> parseCsv(String value) {
        if (value == null || value.isBlank()) {
            return new ArrayList<>();
        }
        return Arrays.stream(value.split(","))
                .map(String::trim)
                .filter(part -> !part.isEmpty())
                .toList();
    }
}
