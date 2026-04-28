package com.timetable.service;

import com.timetable.model.entity.Notification;
import com.timetable.model.entity.Task;
import com.timetable.model.entity.User;
import com.timetable.repository.NotificationRepository;
import com.timetable.repository.TaskRepository;
import com.timetable.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Notification service handling in-app notifications and scheduled reminders.
 * Uses Spring's @Scheduled for background jobs (free, built-in Spring Boot).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    @Value("${app.notification.cleanup-days:30}")
    private int cleanupDays;

    // ─── CRUD ─────────────────────────────────────────────────────────────

    public List<Notification> getUserNotifications(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public List<Notification> getUnreadNotifications(Long userId) {
        return notificationRepository.findByUserIdAndIsRead(userId, false);
    }

    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndIsRead(userId, false);
    }

    @Transactional
    public void markAsRead(Long notificationId) {
        notificationRepository.findById(notificationId).ifPresent(n -> {
            n.setIsRead(true);
            notificationRepository.save(n);
        });
    }

    @Transactional
    public void markAllAsRead(Long userId) {
        notificationRepository.markAllAsRead(userId);
    }

    /**
     * Create and persist a notification for a user.
     */
    @Transactional
    public Notification createNotification(User user, Notification.NotificationType type, String message) {
        Notification notification = Notification.builder()
                .user(user)
                .type(type)
                .message(message)
                .isRead(false)
                .build();
        return notificationRepository.save(notification);
    }

    // ─── Scheduled Jobs (Spring @Scheduled - free) ────────────────────────

    /**
     * Check every 15 minutes for tasks whose reminder time is approaching.
     */
    @Scheduled(fixedDelay = 900000) // 15 minutes
    @Transactional
    public void sendDeadlineReminders() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime soon = now.plusMinutes(20);

        List<Task> dueTasks = taskRepository.findTasksDueForReminder(now, soon);
        for (Task task : dueTasks) {
            String msg = String.format("⏰ Reminder: '%s' is due soon!", task.getTitle());
            createNotification(task.getUser(), Notification.NotificationType.REMINDER, msg);
            log.info("Reminder notification created for task id={}", task.getId());

            // Also send an email notification
            sendTaskDeadlineEmail(task.getUser(), task);
        }
    }

    /**
     * Send a task deadline email to the user.
     */
    public void sendTaskDeadlineEmail(User user, Task task) {
        if (user.getEmail() == null || user.getEmail().isBlank()) return;
        String deadlineStr = task.getDeadline() != null
                ? task.getDeadline().format(DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a"))
                : "No deadline set";
        String body = emailService.buildDeadlineEmailBody(user.getName(), task.getTitle(), deadlineStr);
        emailService.sendHtmlEmail(user.getEmail(), "⏰ Task Reminder: " + task.getTitle(), body);
    }

    /**
     * Clean up old read notifications daily at 2 AM.
     */
    @Scheduled(cron = "0 0 2 * * ?")
    @Transactional
    public void cleanupOldNotifications() {
        LocalDateTime before = LocalDateTime.now().minusDays(cleanupDays);
        notificationRepository.deleteOldReadNotifications(before);
        log.info("Cleaned up read notifications older than {} days", cleanupDays);
    }
}
