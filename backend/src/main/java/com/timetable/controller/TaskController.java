package com.timetable.controller;

import com.timetable.model.dto.TaskRequest;
import com.timetable.model.dto.TaskResponse;
import com.timetable.model.entity.Task;
import com.timetable.model.entity.User;
import com.timetable.service.TaskService;
import com.timetable.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller class that handles HTTP requests related to Task management.
 */
@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
@Tag(name = "Tasks", description = "Endpoints for managing user tasks")
@SecurityRequirement(name = "bearerAuth")
public class TaskController {

    private final TaskService taskService;
    private final UserService userService;

    @PostMapping
    @Operation(summary = "Create a new task")
    public ResponseEntity<TaskResponse> createNewTask(
            @AuthenticationPrincipal UserDetails currentUser,
            @Valid @RequestBody TaskRequest request) {
        Long userId = extractAuthenticatedUser(currentUser).getId();
        TaskResponse response = taskService.createTask(userId, request);
        return ResponseEntity.status(201).body(response);
    }

    @GetMapping
    @Operation(summary = "Get all tasks for the logged-in user")
    public ResponseEntity<List<TaskResponse>> fetchUserTasks(
            @AuthenticationPrincipal UserDetails currentUser,
            @RequestParam(required = false) Long workspaceId) {
        Long userId = extractAuthenticatedUser(currentUser).getId();
        return ResponseEntity.ok(taskService.getUserTasks(userId, workspaceId));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a specific task by its ID")
    public ResponseEntity<TaskResponse> fetchTaskById(
            @AuthenticationPrincipal UserDetails currentUser,
            @PathVariable Long id) {
        Long userId = extractAuthenticatedUser(currentUser).getId();
        return ResponseEntity.ok(taskService.getTaskById(id, userId));
    }

    @GetMapping("/status/{status}")
    @Operation(summary = "Filter tasks based on their status")
    public ResponseEntity<List<TaskResponse>> fetchTasksByStatus(
            @AuthenticationPrincipal UserDetails currentUser,
            @PathVariable Task.TaskStatus status) {
        Long userId = extractAuthenticatedUser(currentUser).getId();
        return ResponseEntity.ok(taskService.getTasksByStatus(userId, status));
    }

    @GetMapping("/category/{category}")
    @Operation(summary = "Filter tasks based on category")
    public ResponseEntity<List<TaskResponse>> fetchTasksByCategory(
            @AuthenticationPrincipal UserDetails currentUser,
            @PathVariable String category) {
        Long userId = extractAuthenticatedUser(currentUser).getId();
        return ResponseEntity.ok(taskService.getTasksByCategory(userId, category));
    }

    @GetMapping("/upcoming")
    @Operation(summary = "Get tasks with upcoming deadlines")
    public ResponseEntity<List<TaskResponse>> fetchUpcomingTasks(
            @AuthenticationPrincipal UserDetails currentUser,
            @RequestParam(defaultValue = "48") int hours) {
        Long userId = extractAuthenticatedUser(currentUser).getId();
        return ResponseEntity.ok(taskService.getUpcomingDeadlines(userId, hours));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an existing task")
    public ResponseEntity<TaskResponse> modifyTask(
            @AuthenticationPrincipal UserDetails currentUser,
            @PathVariable Long id,
            @Valid @RequestBody TaskRequest request) {
        Long userId = extractAuthenticatedUser(currentUser).getId();
        return ResponseEntity.ok(taskService.updateTask(id, userId, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a task")
    public ResponseEntity<Void> removeTask(
            @AuthenticationPrincipal UserDetails currentUser,
            @PathVariable Long id) {
        Long userId = extractAuthenticatedUser(currentUser).getId();
        taskService.deleteTask(id, userId);
        return ResponseEntity.noContent().build();
    }

    private User extractAuthenticatedUser(UserDetails userDetails) {
        return userService.getUserByEmail(userDetails.getUsername());
    }
}
