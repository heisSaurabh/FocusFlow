package com.timetable.model.dto;

import com.timetable.model.entity.AiInsight;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Safe projection of AiInsight entity for API responses.
 */
@Data
public class AiInsightResponse {

    private Long id;
    private Long userId;
    private String insightType;
    private String content;
    private LocalDateTime createdAt;

    public static AiInsightResponse from(AiInsight insight) {
        AiInsightResponse dto = new AiInsightResponse();
        dto.setId(insight.getId());
        dto.setUserId(insight.getUser().getId());
        dto.setInsightType(insight.getType() != null ? insight.getType().name() : null);
        dto.setContent(insight.getContent());
        dto.setCreatedAt(insight.getCreatedAt());
        return dto;
    }
}
