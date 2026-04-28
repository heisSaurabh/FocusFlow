package com.timetable.model.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * AiInsight entity storing AI-generated analysis, suggestions, and chatbot
 * logs.
 */
@Entity
@Table(name = "ai_insights", indexes = {
        @Index(name = "idx_ai_insight_user_id", columnList = "user_id"),
        @Index(name = "idx_ai_insight_type", columnList = "type")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiInsight {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 25)
    private InsightType type;

    /** The insight or suggestion text */
    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    /** Optional: the user's original query that triggered this insight */
    @Column(name = "user_query", columnDefinition = "TEXT")
    private String userQuery;

    /** Engine used: RULE_BASED or GEMINI */
    @Column(name = "engine", length = 15)
    @Builder.Default
    private String engine = "RULE_BASED";

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public enum InsightType {
        SCHEDULE_SUGGESTION,
        TASK_PRIORITIZATION,
        PRODUCTIVITY_TIP,
        NLP_PARSE,
        CHATBOT_RESPONSE
    }
}
