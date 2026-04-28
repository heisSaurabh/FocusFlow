package com.timetable.model.dto;

import com.timetable.model.entity.Task;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonFormat;

/**
 * DTO for Task response with computed AI score.
 */
@Data
@Builder
public class TaskResponse {
    private Long id;
    private String title;
    private String description;
    private Task.Priority priority;
    private Task.TaskStatus status;
    /** Normalized category info (3NF) */
    private Long categoryId;
    private String categoryName;
    @JsonFormat(pattern = "yyyy-MM-dd")
    private java.time.LocalDate deadline;
    private java.time.LocalDateTime reminderAt;
    private Double estimatedHours;
    private Double actualHours;
    private Boolean isRecurring;
    private String recurringPattern;
    private Double aiScore;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime completedAt;
}
