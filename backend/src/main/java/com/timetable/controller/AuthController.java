package com.timetable.controller;

import com.timetable.model.dto.*;
import com.timetable.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Controller for handling user authentication, including registration, login, and token refreshing.
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Endpoints for user registration and login")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @Operation(summary = "Register a new account")
    public ResponseEntity<JwtResponse> registerNewUser(@Valid @RequestBody RegisterRequest registrationData) {
        return ResponseEntity.status(201).body(authService.register(registrationData));
    }

    @PostMapping("/login")
    @Operation(summary = "Authenticate user credentials")
    public ResponseEntity<JwtResponse> authenticateUser(@Valid @RequestBody LoginRequest loginData) {
        return ResponseEntity.ok(authService.login(loginData));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh the JWT access token")
    public ResponseEntity<JwtResponse> refreshAccessToken(@RequestBody Map<String, String> payload) {
        String refreshToken = payload.get("refreshToken");
        if (refreshToken == null || refreshToken.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(authService.refreshToken(refreshToken));
    }
}
