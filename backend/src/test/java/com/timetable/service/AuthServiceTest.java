package com.timetable.service;

import com.timetable.model.dto.RegisterRequest;
import com.timetable.model.dto.JwtResponse;
import com.timetable.model.entity.Role;
import com.timetable.model.entity.User;
import com.timetable.repository.RoleRepository;
import com.timetable.repository.UserRepository;
import com.timetable.security.JwtUtils;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.springframework.test.util.ReflectionTestUtils;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for AuthService registration and duplicate email handling.
 */
@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private RoleRepository roleRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private AuthenticationManager authenticationManager;

    private JwtUtils jwtUtils;
    private AuthService authService;

    @BeforeEach
    void setUp() {
        jwtUtils = new JwtUtils();
        ReflectionTestUtils.setField(jwtUtils, "jwtSecret", "thisisaverylongsecretkeyforjwttokensgeneration123456");
        ReflectionTestUtils.setField(jwtUtils, "jwtExpirationMs", 3600000L);
        ReflectionTestUtils.setField(jwtUtils, "refreshExpirationMs", 86400000L);

        authService = new AuthService(userRepository, roleRepository, passwordEncoder, authenticationManager, jwtUtils);
    }

    @Test
    @DisplayName("Should register new user and return JWT response")
    void shouldRegisterUser() {
        RegisterRequest req = new RegisterRequest();
        req.setName("Test User");
        req.setEmail("test@example.com");
        req.setPassword("password123");

        Role role = Role.builder().id(1L).name(Role.RoleName.ROLE_USER).build();
        User savedUser = User.builder()
                .id(1L).name("Test User").email("test@example.com")
                .password("hashed").roles(Set.of(role)).isEnabled(true).build();

        when(userRepository.existsByEmail("test@example.com")).thenReturn(false);
        when(roleRepository.findByName(Role.RoleName.ROLE_USER)).thenReturn(Optional.of(role));
        when(passwordEncoder.encode("password123")).thenReturn("hashed");
        when(passwordEncoder.encode("password123")).thenReturn("hashed");
        when(userRepository.save(any(User.class))).thenReturn(savedUser);

        JwtResponse response = authService.register(req);

        assertThat(response).isNotNull();
        assertThat(response.getEmail()).isEqualTo("test@example.com");
        assertThat(response.getAccessToken()).isNotEmpty();
        assertThat(response.getRoles()).contains("ROLE_USER");
    }

    @Test
    @DisplayName("Should throw exception for duplicate email")
    void shouldThrowForDuplicateEmail() {
        RegisterRequest req = new RegisterRequest();
        req.setEmail("existing@example.com");
        req.setPassword("password123");
        req.setName("Someone");

        when(userRepository.existsByEmail("existing@example.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("already registered");
    }
}
