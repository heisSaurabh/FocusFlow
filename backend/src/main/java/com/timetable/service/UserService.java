package com.timetable.service;

import com.timetable.exception.ResourceNotFoundException;
import com.timetable.model.entity.User;
import com.timetable.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.UUID;

/**
 * Service for user profile management.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));
    }

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
    }

    @Transactional
    public User updateProfile(Long userId, Map<String, String> updates) {
        User user = getUserById(userId);
        if (updates.containsKey("name"))
            user.setName(updates.get("name"));
        if (updates.containsKey("phone"))
            user.setPhone(updates.get("phone"));
        if (updates.containsKey("bio"))
            user.setBio(updates.get("bio"));
        if (updates.containsKey("avatarUrl"))
            user.setAvatarUrl(updates.get("avatarUrl"));
        if (updates.containsKey("dailyWorkHoursGoal"))
            user.setDailyWorkHoursGoal(Integer.parseInt(updates.get("dailyWorkHoursGoal")));
        log.info("Profile updated for user id={}", userId);
        return userRepository.save(user);
    }

    @Transactional
    public void changePassword(Long userId, String oldPassword, String newPassword) {
        User user = getUserById(userId);
        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        log.info("Password changed for user id={}", userId);
    }

    /**
     * Upload and persist a profile avatar image for the user.
     * The file is stored under {uploadDir}/avatars/ and the avatarUrl
     * is updated to point to the served path /api/uploads/avatars/{filename}.
     */
    @Transactional
    public User uploadAvatar(Long userId, MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Uploaded file is empty");
        }
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("Only image files are allowed");
        }

        // Determine extension
        String originalFilename = file.getOriginalFilename();
        String extension = (originalFilename != null && originalFilename.contains("."))
                ? originalFilename.substring(originalFilename.lastIndexOf('.'))
                : ".jpg";

        // Unique filename — prevents path traversal
        String filename = "avatar_" + userId + "_" + UUID.randomUUID() + extension;

        // Ensure directory exists
        Path avatarDir = Paths.get(uploadDir, "avatars");
        Files.createDirectories(avatarDir);

        // Save the file
        Path destination = avatarDir.resolve(filename);
        Files.copy(file.getInputStream(), destination, StandardCopyOption.REPLACE_EXISTING);

        // Update user record
        User user = getUserById(userId);
        user.setAvatarUrl("/api/uploads/avatars/" + filename);
        User saved = userRepository.save(user);
        log.info("Avatar uploaded for user id={} -> {}", userId, filename);
        return saved;
    }
}
