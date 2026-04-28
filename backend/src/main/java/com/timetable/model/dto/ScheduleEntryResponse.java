package com.timetable.model.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalTime;
import java.time.LocalDateTime;

/**
 * DTO for ScheduleEntry response.
 */
@Data
@Builder
public class ScheduleEntryResponse {
    private Long id;
    private Long timetableId;
    private Long taskId;
    private String title;
    private String description;
    private Integer dayOfWeek;
    private LocalTime startTime;
    private LocalTime endTime;
    private Boolean isRecurring;
    private Boolean isAiGenerated;
    private LocalDateTime createdAt;
}
