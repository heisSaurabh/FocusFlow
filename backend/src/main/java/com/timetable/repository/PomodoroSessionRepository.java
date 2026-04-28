package com.timetable.repository;

import com.timetable.model.entity.PomodoroSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PomodoroSessionRepository extends JpaRepository<PomodoroSession, Long> {

    List<PomodoroSession> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<PomodoroSession> findByUserIdAndIsCompleted(Long userId, Boolean isCompleted);

    @Query("SELECT COUNT(p) FROM PomodoroSession p WHERE p.user.id = :userId " +
            "AND p.sessionType = 'WORK' AND p.isCompleted = true " +
            "AND p.completedAt BETWEEN :from AND :to")
    Long countCompletedWorkSessions(@Param("userId") Long userId,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);

    @Query("SELECT SUM(p.durationMinutes) FROM PomodoroSession p WHERE p.user.id = :userId " +
            "AND p.sessionType = 'WORK' AND p.isCompleted = true " +
            "AND p.completedAt BETWEEN :from AND :to")
    Long sumFocusMinutes(@Param("userId") Long userId,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);
}
