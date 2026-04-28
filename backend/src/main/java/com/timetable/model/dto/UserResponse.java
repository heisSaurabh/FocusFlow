package com.timetable.model.dto;

import com.timetable.model.entity.User;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Safe projection of User entity for API responses.
 * Never includes the password field.
 */
@Data
public class UserResponse {

    private Long id;
    private String email;
    private String name;
    private String phone;
    private String bio;
    private String avatarUrl;
    private Boolean isEnabled;
    private Integer dailyWorkHoursGoal;
    private Set<String> roles;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static UserResponse from(User user) {
        UserResponse dto = new UserResponse();
        dto.setId(user.getId());
        dto.setEmail(user.getEmail());
        dto.setName(user.getName());
        dto.setPhone(user.getPhone());
        dto.setBio(user.getBio());
        dto.setAvatarUrl(user.getAvatarUrl());
        dto.setIsEnabled(user.getIsEnabled());
        dto.setDailyWorkHoursGoal(user.getDailyWorkHoursGoal());
        dto.setRoles(user.getRoles().stream()
                .map(r -> r.getName().name())
                .collect(Collectors.toSet()));
        dto.setCreatedAt(user.getCreatedAt());
        dto.setUpdatedAt(user.getUpdatedAt());
        return dto;
    }
}
