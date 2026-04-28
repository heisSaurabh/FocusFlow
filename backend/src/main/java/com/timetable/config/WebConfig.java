package com.timetable.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Configures Spring MVC to serve uploaded files (avatars) from the local
 * filesystem as static resources at /api/uploads/**.
 * The directory is created on startup if it does not already exist.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(@org.springframework.lang.NonNull ResourceHandlerRegistry registry) {
        Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();

        // Ensure the uploads directory exists so Spring can serve from it
        try {
            Files.createDirectories(uploadPath.resolve("avatars"));
        } catch (Exception ignored) {}

        String uploadLocation = "file:" + uploadPath.toString().replace("\\", "/") + "/";

        registry.addResourceHandler("/api/uploads/**")
                .addResourceLocations(uploadLocation)
                .setCachePeriod(0); // No cache during development
    }

    @Override
    public void addCorsMappings(@org.springframework.lang.NonNull CorsRegistry registry) {
        registry.addMapping("/api/uploads/**")
                .allowedOriginPatterns("*")
                .allowedMethods("GET");
    }
}
