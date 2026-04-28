package com.timetable.config;

import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.ollama.OllamaChatModel;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

/**
 * Configuration for LangChain4j Local AI Integration.
 * Connects to a local Ollama instance for 100% private processing.
 */
@Configuration
public class AiConfig {

    @Value("${focusflow.ai.ollama.url:http://localhost:11434}")
    private String ollamaUrl;

    @Value("${focusflow.ai.ollama.model:llama3}")
    private String modelName;

    @Bean
    public ChatLanguageModel chatLanguageModel() {
        return OllamaChatModel.builder()
                .baseUrl(ollamaUrl)
                .modelName(modelName)
                .timeout(Duration.ofSeconds(60))
                .temperature(0.7)
                .build();
    }
}
