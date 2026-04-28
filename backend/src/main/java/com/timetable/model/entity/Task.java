package com.timetable.model.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Task entity representing a user task with priority, category, deadlines, and
 * status.
 * Supports recurring tasks and Pomodoro integration.
 */
@Entity
@Table(name = "tasks", indexes = {
        @Index(name = "idx_task_user_id", columnList = "user_id"),
        @Index(name = "idx_task_status", columnList = "status"),
        @Index(name = "idx_task_deadline", columnList = "deadline"),
        @Index(name = "idx_task_priority", columnList = "priority")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workspace_id")
    private Workspace workspace;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    /**
     * Task priority used for AI-based scheduling.
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    @Builder.Default
    private Priority priority = Priority.MEDIUM;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 15)
    @Builder.Default
    private TaskStatus status = TaskStatus.TODO;

    /**
     * Normalized category via FK to task_categories table (3NF).
     * Replaces the old Category ENUM column.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private TaskCategory taskCategory;

    /** Legacy ENUM kept for AiService rule-based classification — not persisted as a column */
    @Transient
    public Category getCategoryEnum() {
        if (taskCategory == null) return Category.PERSONAL;
        try { return Category.valueOf(taskCategory.getName()); }
        catch (IllegalArgumentException e) { return Category.OTHER; }
    }

    @JsonFormat(pattern = "yyyy-MM-dd", shape = JsonFormat.Shape.STRING)
    @Column(name = "deadline")
    private LocalDate deadline;

    @Column(name = "reminder_at")
    private LocalDateTime reminderAt;

    @Column(name = "estimated_hours")
    @Builder.Default
    private Double estimatedHours = 1.0;

    @Column(name = "actual_hours")
    @Builder.Default
    private Double actualHours = 0.0;

    /** Color hex code for UI display, e.g. #FF5733 */
    @Column(name = "color", length = 10)
    @Builder.Default
    private String color = "#6366f1";

    @Column(name = "is_recurring")
    @Builder.Default
    private Boolean isRecurring = false;

    /** Recurring pattern: DAILY, WEEKLY, MONTHLY */
    @Column(name = "recurring_pattern", length = 20)
    private String recurringPattern;

    /** AI-computed priority score (0-100) */
    @Column(name = "ai_score")
    private Double aiScore;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    // ─── Enums ──────────────────────────────────────────────────────────

    public enum Priority {
        LOW, MEDIUM, HIGH, URGENT
    }

    public enum TaskStatus {
        TODO, IN_PROGRESS, COMPLETED, CANCELLED
    }

    public enum Category {
        STUDY, WORK, PERSONAL, HEALTH, FINANCE, OTHER
    }
}
