package com.timetable.model.dto;

import com.timetable.model.entity.Notification;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Safe projection of Notification entity for API responses.
 * Avoids lazy-loading the User relationship during serialization.
 */
@Data
public class NotificationResponse {

    private Long id;
    private Long userId;
    private Notification.NotificationType type;
    private String message;
    private Boolean isRead;
    private LocalDateTime triggeredAt;
    private LocalDateTime createdAt;

    public static NotificationResponse from(Notification n) {
        NotificationResponse dto = new NotificationResponse();
        dto.setId(n.getId());
        dto.setUserId(n.getUser().getId());
        dto.setType(n.getType());
        dto.setMessage(n.getMessage());
        dto.setIsRead(n.getIsRead());
        dto.setTriggeredAt(n.getTriggeredAt());
        dto.setCreatedAt(n.getCreatedAt());
        return dto;
    }
}
