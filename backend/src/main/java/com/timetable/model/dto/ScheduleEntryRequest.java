package com.timetable.model.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.time.LocalTime;

/**
 * DTO for creating/updating a ScheduleEntry (timetable time block).
 */
@Data
public class ScheduleEntryRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 150)
    private String title;

    @Size(max = 500)
    private String description;

    @NotNull(message = "Day of week is required")
    @Min(0)
    @Max(6)
    private Integer dayOfWeek;

    @NotNull(message = "Start time is required")
    private LocalTime startTime;

    @NotNull(message = "End time is required")
    private LocalTime endTime;

    private Boolean isRecurring;
    private Long taskId;
}
