package com.timetable.model.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * TaskCategory entity — extracted from the Task.Category ENUM for 3NF compliance.
 * Allows system-defined categories (user_id = NULL) and user-defined custom categories.
 */
@Entity
@Table(name = "task_categories", indexes = {
        @Index(name = "idx_category_user_id", columnList = "user_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Category name, e.g. STUDY, WORK, PERSONAL, HEALTH, FINANCE, OTHER */
    @Column(nullable = false, length = 30)
    private String name;

    /**
     * NULL = system-level (available to all users).
     * Non-null = user-defined custom category.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;
}
