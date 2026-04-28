package com.timetable.model.dto;

import lombok.Data;

/**
 * Request body for updating a user's profile fields.
 */
@Data
public class UserUpdateRequest {
    private String name;
    private String phone;
    private String bio;
    private String avatarUrl;
    private Integer dailyWorkHoursGoal;
}
