package com.timetable.model.dto;

import com.timetable.model.entity.Task;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonFormat;

/**
 * DTO for creating or updating a Task.
 */
@Data
public class TaskRequest {
    private Long workspaceId;

    @NotBlank(message = "Title is required")
    @Size(max = 200, message = "Title must be under 200 characters")
    private String title;

    @Size(max = 2000)
    private String description;

    @NotNull(message = "Priority is required")
    private Task.Priority priority;

    private Task.TaskStatus status;

    /** FK to task_categories.id (3NF normalized) */
    private Long categoryId;

    @JsonFormat(pattern = "yyyy-MM-dd", shape = JsonFormat.Shape.STRING)
    private java.time.LocalDate deadline;
    private java.time.LocalDateTime reminderAt;

    @DecimalMin("0.25")
    @DecimalMax("100.0")
    private Double estimatedHours;

    private Boolean isRecurring;
    private String recurringPattern;
}
