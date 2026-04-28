package com.timetable.service;

import com.timetable.exception.ResourceNotFoundException;
import com.timetable.model.entity.PomodoroSession;
import com.timetable.model.entity.Task;
import com.timetable.model.entity.User;
import com.timetable.repository.PomodoroSessionRepository;
import com.timetable.repository.TaskRepository;
import com.timetable.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Service for Pomodoro Timer session tracking.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PomodoroService {

    private final PomodoroSessionRepository sessionRepository;
    private final UserRepository userRepository;
    private final TaskRepository taskRepository;

    @Value("${app.pomodoro.work-duration-minutes:25}")
    private int workDuration;

    @Value("${app.pomodoro.short-break-minutes:5}")
    private int shortBreak;

    @Value("${app.pomodoro.long-break-minutes:15}")
    private int longBreak;

    @Transactional
    public PomodoroSession startSession(Long userId, Long taskId, PomodoroSession.SessionType type) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        Task task = null;
        if (taskId != null) {
            task = taskRepository.findById(taskId).orElse(null);
        }

        int duration = switch (type) {
            case WORK -> workDuration;
            case SHORT_BREAK -> shortBreak;
            case LONG_BREAK -> longBreak;
        };

        PomodoroSession session = PomodoroSession.builder()
                .user(user).task(task)
                .sessionType(type)
                .durationMinutes(duration)
                .startedAt(LocalDateTime.now())
                .isCompleted(false)
                .build();

        return sessionRepository.save(session);
    }

    @Transactional
    public PomodoroSession completeSession(Long sessionId, Long userId) {
        PomodoroSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("PomodoroSession", sessionId));
        if (!session.getUser().getId().equals(userId)) {
            throw new com.timetable.exception.UnauthorizedException("Not your session");
        }
        session.setIsCompleted(true);
        session.setCompletedAt(LocalDateTime.now());
        log.info("Pomodoro session {} completed for user {}", sessionId, userId);
        return sessionRepository.save(session);
    }

    public List<PomodoroSession> getUserSessions(Long userId) {
        return sessionRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public int getWorkDuration() {
        return workDuration;
    }

    public int getShortBreak() {
        return shortBreak;
    }

    public int getLongBreak() {
        return longBreak;
    }
}
