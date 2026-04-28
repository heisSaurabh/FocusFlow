package com.timetable.service;

import com.timetable.exception.ResourceNotFoundException;
import com.timetable.exception.UnauthorizedException;
import com.timetable.model.dto.TaskRequest;
import com.timetable.model.dto.TaskResponse;
import com.timetable.model.entity.Task;
import com.timetable.model.entity.TaskCategory;
import com.timetable.model.entity.User;
import com.timetable.model.entity.Workspace;
import com.timetable.repository.TaskCategoryRepository;
import com.timetable.repository.TaskRepository;
import com.timetable.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

/**
 * Service class that manages core CRUD logic for tasks, including AI priority scores.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TaskService {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final TaskCategoryRepository taskCategoryRepository;

    // ─── Create ──────────────────────────────────────────────────────────

    @Transactional
    public TaskResponse createTask(Long userId, TaskRequest request) {
        User user = fetchUser(userId);
        TaskCategory category = resolveCategory(request.getCategoryId());

        Task task = Task.builder()
                .user(user)
                .title(request.getTitle())
                .description(request.getDescription())
                .priority(request.getPriority() != null ? request.getPriority() : Task.Priority.MEDIUM)
                .status(request.getStatus() != null ? request.getStatus() : Task.TaskStatus.TODO)
                .taskCategory(category)
                .deadline(request.getDeadline())
                .reminderAt(request.getReminderAt())
                .estimatedHours(request.getEstimatedHours() != null ? request.getEstimatedHours() : 1.0)
                .isRecurring(request.getIsRecurring() != null ? request.getIsRecurring() : false)
                .recurringPattern(request.getRecurringPattern())
                .build();

        if (request.getWorkspaceId() != null) {
            task.setWorkspace(Workspace.builder().id(request.getWorkspaceId()).build());
        }

        task.setAiScore(computeAiScore(task));
        Task savedTask = taskRepository.save(task);
        return toResponse(savedTask);
    }

    @Transactional(readOnly = true)
    public List<TaskResponse> getUserTasks(Long userId, Long workspaceId) {
        List<Task> retrievedTasks;
        if (workspaceId != null) {
            retrievedTasks = taskRepository.findByUserIdAndWorkspaceIdOrderByCreatedAtDesc(userId, workspaceId);
        } else {
            retrievedTasks = taskRepository.findByUserIdAndWorkspaceIsNullOrderByCreatedAtDesc(userId);
        }
        
        List<TaskResponse> responseList = new ArrayList<>();
        for (Task task : retrievedTasks) {
            responseList.add(toResponse(task));
        }
        return responseList;
    }

    @Transactional(readOnly = true)
    public List<TaskResponse> getTasksByStatus(Long userId, Task.TaskStatus status) {
        List<Task> tasks = taskRepository.findByUserIdAndStatus(userId, status);
        List<TaskResponse> responseList = new ArrayList<>();
        for (Task task : tasks) {
            responseList.add(toResponse(task));
        }
        return responseList;
    }

    @Transactional(readOnly = true)
    public List<TaskResponse> getTasksByCategory(Long userId, String categoryName) {
        List<Task> tasks = taskRepository.findByUserIdAndCategoryName(userId, categoryName);
        List<TaskResponse> responseList = new ArrayList<>();
        for (Task task : tasks) {
            responseList.add(toResponse(task));
        }
        return responseList;
    }

    @Transactional(readOnly = true)
    public List<TaskResponse> getUpcomingDeadlines(Long userId, int days) {
        LocalDate now = LocalDate.now();
        LocalDate untilDate = now.plusDays(days);
        List<Task> tasks = taskRepository.findUpcomingDeadlines(userId, now, untilDate);
        
        List<TaskResponse> responseList = new ArrayList<>();
        for (Task task : tasks) {
            responseList.add(toResponse(task));
        }
        return responseList;
    }

    @Transactional(readOnly = true)
    public TaskResponse getTaskById(Long taskId, Long userId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task", taskId));
        if (!task.getUser().getId().equals(userId)) {
            throw new UnauthorizedException("Access denied: You do not own this task");
        }
        return toResponse(task);
    }

    // ─── Update ───────────────────────────────────────────────────────────

    @Transactional
    public TaskResponse updateTask(Long taskId, Long userId, TaskRequest request) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task", taskId));
        if (!task.getUser().getId().equals(userId)) {
            throw new UnauthorizedException("Access denied: You do not own this task");
        }

        if (request.getTitle() != null) task.setTitle(request.getTitle());
        if (request.getDescription() != null) task.setDescription(request.getDescription());
        if (request.getPriority() != null) task.setPriority(request.getPriority());
        if (request.getCategoryId() != null) task.setTaskCategory(resolveCategory(request.getCategoryId()));
        if (request.getDeadline() != null) task.setDeadline(request.getDeadline());
        if (request.getReminderAt() != null) task.setReminderAt(request.getReminderAt());
        if (request.getEstimatedHours() != null) task.setEstimatedHours(request.getEstimatedHours());
        if (request.getIsRecurring() != null) task.setIsRecurring(request.getIsRecurring());
        if (request.getRecurringPattern() != null) task.setRecurringPattern(request.getRecurringPattern());

        if (request.getStatus() != null && request.getStatus() != task.getStatus()) {
            task.setStatus(request.getStatus());
            if (request.getStatus() == Task.TaskStatus.COMPLETED) {
                task.setCompletedAt(LocalDateTime.now());
            }
        }

        task.setAiScore(computeAiScore(task));
        return toResponse(taskRepository.save(task));
    }

    // ─── Delete ───────────────────────────────────────────────────────────

    @Transactional
    public void deleteTask(Long taskId, Long userId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task", taskId));
        if (!task.getUser().getId().equals(userId)) {
            throw new UnauthorizedException("Access denied: You do not own this task");
        }
        taskRepository.delete(task);
        log.info("Successfully deleted task with ID={}", taskId);
    }

    // ─── Internal Helpers ─────────────────────────────────────────────────

    private User fetchUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
    }

    private TaskCategory resolveCategory(Long categoryId) {
        if (categoryId == null) return null;
        return taskCategoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("TaskCategory", categoryId));
    }

    private double computeAiScore(Task task) {
        double priorityScoreWeight = switch (task.getPriority()) {
            case URGENT -> 100.0;
            case HIGH -> 75.0;
            case MEDIUM -> 50.0;
            case LOW -> 25.0;
        };

        double urgencyFactor = 1.0;
        if (task.getDeadline() != null) {
            long daysToDeadline = ChronoUnit.DAYS.between(LocalDate.now(), task.getDeadline());
            if (daysToDeadline <= 0) {
                urgencyFactor = 2.0;
            } else if (daysToDeadline <= 1) {
                urgencyFactor = 1.8;
            } else if (daysToDeadline <= 3) {
                urgencyFactor = 1.5;
            } else if (daysToDeadline <= 7) {
                urgencyFactor = 1.2;
            }
        }

        return Math.min(100.0, priorityScoreWeight * urgencyFactor);
    }

    public TaskResponse toResponse(Task task) {
        TaskCategory category = task.getTaskCategory();
        return TaskResponse.builder()
                .id(task.getId())
                .title(task.getTitle())
                .description(task.getDescription())
                .priority(task.getPriority())
                .status(task.getStatus())
                .categoryId(category != null ? category.getId() : null)
                .categoryName(category != null ? category.getName() : null)
                .deadline(task.getDeadline())
                .reminderAt(task.getReminderAt())
                .estimatedHours(task.getEstimatedHours())
                .actualHours(task.getActualHours())
                .isRecurring(task.getIsRecurring())
                .recurringPattern(task.getRecurringPattern())
                .aiScore(task.getAiScore())
                .createdAt(task.getCreatedAt())
                .updatedAt(task.getUpdatedAt())
                .completedAt(task.getCompletedAt())
                .build();
    }
}
