package com.timetable.model.dto;

import com.timetable.model.entity.Timetable;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class TimetableRequest {
    private Long workspaceId;
    @NotBlank(message = "Name is required")
    @Size(max = 100)
    private String name;

    @Size(max = 500)
    private String description;

    private Timetable.TimetableType type;
    private Boolean isActive;
}
