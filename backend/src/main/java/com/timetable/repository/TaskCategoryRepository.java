package com.timetable.repository;

import com.timetable.model.entity.TaskCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for TaskCategory entity.
 * Retrieves both system-defined (user_id = NULL) and user-defined categories.
 */
@Repository
public interface TaskCategoryRepository extends JpaRepository<TaskCategory, Long> {

    /** Get all categories visible to a user: system-wide + their own */
    @Query("SELECT c FROM TaskCategory c WHERE c.user IS NULL OR c.user.id = :userId ORDER BY c.id")
    List<TaskCategory> findAvailableForUser(@Param("userId") Long userId);

    /** Find a system category by name (for seeding/lookups) */
    Optional<TaskCategory> findByNameAndUserIsNull(String name);
}
