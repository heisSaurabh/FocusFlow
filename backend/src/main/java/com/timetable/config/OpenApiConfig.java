package com.timetable.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeIn;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.info.License;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import org.springframework.context.annotation.Configuration;

/**
 * OpenAPI / Swagger configuration.
 * Access Swagger UI at: http://localhost:8080/swagger-ui/index.html
 * API docs at: http://localhost:8080/api-docs
 */
@Configuration
@OpenAPIDefinition(info = @Info(title = "Timetable & Productivity Manager API", description = "Complete SaaS REST API for timetable management, tasks, AI scheduling, analytics, and Pomodoro timer. "
        +
        "All AI features use a built-in rule-based engine (100% free, no external API needed).", version = "1.0.0", contact = @Contact(name = "Timetable Team", email = "support@timetable.com"), license = @License(name = "MIT")))
@SecurityScheme(name = "bearerAuth", type = SecuritySchemeType.HTTP, scheme = "bearer", bearerFormat = "JWT", in = SecuritySchemeIn.HEADER, description = "Enter JWT token obtained from /api/auth/login")
public class OpenApiConfig {
    // Configuration is annotation-driven
}
