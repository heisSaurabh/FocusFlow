package com.timetable.service;

import com.timetable.model.dto.TaskRequest;
import com.timetable.model.dto.TaskResponse;
import com.timetable.model.entity.Task;
import com.timetable.model.entity.TaskCategory;
import com.timetable.model.entity.User;
import com.timetable.repository.TaskCategoryRepository;
import com.timetable.repository.TaskRepository;
import com.timetable.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for TaskService using JUnit 5 + Mockito.
 * Tests CRUD operations and the rule-based AI scoring algorithm.
 */
@ExtendWith(MockitoExtension.class)
class TaskServiceTest {

    @Mock
    private TaskRepository taskRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private TaskCategoryRepository taskCategoryRepository;

    @InjectMocks
    private TaskService taskService;

    private User mockUser;
    private Task mockTask;

    @BeforeEach
    void setUp() {
        mockUser = User.builder()
                .id(1L).name("Alice").email("alice@example.com")
                .password("hashed").isEnabled(true).build();

        TaskCategory mockCategory = TaskCategory.builder()
                .id(1L).name("STUDY").build();

        mockTask = Task.builder()
                .id(1L).user(mockUser)
                .title("Test Task").description("Test description")
                .priority(Task.Priority.HIGH)
                .status(Task.TaskStatus.TODO)
                .taskCategory(mockCategory)
                .estimatedHours(2.0)
                .isRecurring(false)
                .build();
    }

    @Test
    @DisplayName("Should create a task and compute AI score")
    void shouldCreateTask() {
        // Arrange
        TaskRequest req = new TaskRequest();
        req.setTitle("New Task");
        req.setPriority(Task.Priority.HIGH);
        // No categoryId needed — null is acceptable (resolveCategory handles it)

        when(userRepository.findById(1L)).thenReturn(Optional.of(mockUser));
        when(taskRepository.save(any(Task.class))).thenAnswer(inv -> {
            Task t = inv.getArgument(0);
            t.setId(10L);
            return t;
        });

        // Act
        TaskResponse response = taskService.createTask(1L, req);

        // Assert
        assertThat(response).isNotNull();
        assertThat(response.getTitle()).isEqualTo("New Task");
        assertThat(response.getPriority()).isEqualTo(Task.Priority.HIGH);
        assertThat(response.getAiScore()).isGreaterThan(0);
        verify(taskRepository, times(1)).save(any(Task.class));
    }

    @Test
    @DisplayName("AI score should be higher for URGENT tasks")
    void aiScoreShouldBeHigherForUrgentTasks() {
        // URGENT task
        TaskRequest urgentReq = new TaskRequest();
        urgentReq.setTitle("Urgent Task");
        urgentReq.setPriority(Task.Priority.URGENT);
        urgentReq.setDeadline(LocalDate.now().plusDays(1));

        // LOW task
        TaskRequest lowReq = new TaskRequest();
        lowReq.setTitle("Low Task");
        lowReq.setPriority(Task.Priority.LOW);

        when(userRepository.findById(1L)).thenReturn(Optional.of(mockUser));
        when(taskRepository.save(any(Task.class))).thenAnswer(inv -> {
            Task t = inv.getArgument(0);
            t.setId((long) (Math.random() * 100));
            return t;
        });

        TaskResponse urgent = taskService.createTask(1L, urgentReq);
        TaskResponse low = taskService.createTask(1L, lowReq);

        assertThat(urgent.getAiScore()).isGreaterThan(low.getAiScore());
    }

    @Test
    @DisplayName("Should return all tasks for a user")
    void shouldReturnAllTasksForUser() {
        when(taskRepository.findByUserIdAndWorkspaceIsNullOrderByCreatedAtDesc(1L))
                .thenReturn(List.of(mockTask));

        List<TaskResponse> tasks = taskService.getUserTasks(1L, null);

        assertThat(tasks).hasSize(1);
        assertThat(tasks.get(0).getTitle()).isEqualTo("Test Task");
    }

    @Test
    @DisplayName("Should update task status and set completedAt when COMPLETED")
    void shouldSetCompletedAtWhenStatusIsCompleted() {
        TaskRequest req = new TaskRequest();
        req.setStatus(Task.TaskStatus.COMPLETED);

        when(taskRepository.findById(1L)).thenReturn(Optional.of(mockTask));
        when(taskRepository.save(any(Task.class))).thenAnswer(inv -> inv.getArgument(0));

        TaskResponse response = taskService.updateTask(1L, 1L, req);

        assertThat(response.getStatus()).isEqualTo(Task.TaskStatus.COMPLETED);
        assertThat(response.getCompletedAt()).isNotNull();
    }

    @Test
    @DisplayName("Should delete task")
    void shouldDeleteTask() {
        when(taskRepository.findById(1L)).thenReturn(Optional.of(mockTask));
        doNothing().when(taskRepository).delete(mockTask);

        assertThatCode(() -> taskService.deleteTask(1L, 1L)).doesNotThrowAnyException();
        verify(taskRepository).delete(mockTask);
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException for missing task")
    void shouldThrowForMissingTask() {
        when(taskRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> taskService.getTaskById(99L, 1L))
                .isInstanceOf(com.timetable.exception.ResourceNotFoundException.class);
    }
}
