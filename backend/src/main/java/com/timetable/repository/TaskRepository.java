package com.timetable.repository;

import com.timetable.model.entity.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Repository for Task entity with filtering and analytics queries.
 */
@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {

    List<Task> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<Task> findByUserIdAndWorkspaceIdOrderByCreatedAtDesc(Long userId, Long workspaceId);

    List<Task> findByUserIdAndWorkspaceIsNullOrderByCreatedAtDesc(Long userId);

    List<Task> findByUserIdAndStatus(Long userId, Task.TaskStatus status);

    List<Task> findByUserIdAndPriority(Long userId, Task.Priority priority);

    /** Find tasks by normalized category name */
    @Query("SELECT t FROM Task t WHERE t.user.id = :userId AND t.taskCategory.name = :categoryName")
    List<Task> findByUserIdAndCategoryName(@Param("userId") Long userId, @Param("categoryName") String categoryName);

    /** Tasks with deadlines approaching within given window */
    @Query("SELECT t FROM Task t WHERE t.user.id = :userId " +
            "AND t.deadline BETWEEN :now AND :until " +
            "AND t.status != 'COMPLETED'")
    List<Task> findUpcomingDeadlines(@Param("userId") Long userId,
            @Param("now") java.time.LocalDate now,
            @Param("until") java.time.LocalDate until);

    /** Tasks approaching reminder time */
    @Query("SELECT t FROM Task t WHERE t.reminderAt BETWEEN :now AND :until " +
            "AND t.status != 'COMPLETED'")
    List<Task> findTasksDueForReminder(@Param("now") LocalDateTime now,
            @Param("until") LocalDateTime until);

    /** Count completed tasks between dates for analytics */
    @Query("SELECT COUNT(t) FROM Task t WHERE t.user.id = :userId " +
            "AND t.status = 'COMPLETED' " +
            "AND t.completedAt BETWEEN :from AND :to")
    Long countCompletedBetween(@Param("userId") Long userId,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);

    /** Sum of actual hours by category name for analytics (uses normalized join) */
    @Query("SELECT t.taskCategory.name, SUM(t.actualHours) FROM Task t " +
            "WHERE t.user.id = :userId AND t.completedAt BETWEEN :from AND :to " +
            "GROUP BY t.taskCategory.name")
    List<Object[]> sumHoursByCategory(@Param("userId") Long userId,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);

    /** All incomplete tasks for AI scheduling */
    @Query("SELECT t FROM Task t WHERE t.user.id = :userId " +
            "AND t.status NOT IN ('COMPLETED','CANCELLED') " +
            "ORDER BY t.deadline ASC NULLS LAST, t.priority DESC")
    List<Task> findActiveTasksForScheduling(@Param("userId") Long userId);
}
