package com.timetable.controller;

import com.timetable.model.entity.TaskCategory;
import com.timetable.model.entity.User;
import com.timetable.repository.TaskCategoryRepository;
import com.timetable.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for task categories (3NF normalized).
 * Returns system categories + user-defined categories.
 * Any authenticated user can create personal categories.
 * Admins can delete any category; users can only delete their own.
 */
@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
@Tag(name = "Categories", description = "Task category management")
@SecurityRequirement(name = "bearerAuth")
public class TaskCategoryController {

    private final TaskCategoryRepository taskCategoryRepository;
    private final UserService userService;

    @GetMapping
    @Operation(summary = "Get all available categories for current user")
    public ResponseEntity<List<TaskCategory>> getCategories(
            @AuthenticationPrincipal UserDetails ud) {
        User user = userService.getUserByEmail(ud.getUsername());
        return ResponseEntity.ok(taskCategoryRepository.findAvailableForUser(user.getId()));
    }

    @PostMapping
    @Operation(summary = "Create a new category (admin = system-wide, user = personal)")
    public ResponseEntity<TaskCategory> createCategory(
            @AuthenticationPrincipal UserDetails ud,
            @RequestBody CategoryRequest request) {

        boolean isAdmin = ud.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        // Admins create system categories (user = null), regular users create personal
        // ones
        User owner = isAdmin ? null : userService.getUserByEmail(ud.getUsername());

        TaskCategory cat = TaskCategory.builder()
                .name(request.getName() != null ? request.getName().trim().toUpperCase() : "NEW")
                .user(owner)
                .build();

        return ResponseEntity.status(201).body(taskCategoryRepository.save(cat));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a category by ID")
    public ResponseEntity<Void> deleteCategory(
            @AuthenticationPrincipal UserDetails ud,
            @PathVariable Long id) {

        TaskCategory cat = taskCategoryRepository.findById(id).orElse(null);
        if (cat == null)
            return ResponseEntity.notFound().build();

        boolean isAdmin = ud.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (!isAdmin) {
            // Non-admin users can only delete their own categories
            User caller = userService.getUserByEmail(ud.getUsername());
            User catOwner = cat.getUser();
            if (catOwner == null || !catOwner.getId().equals(caller.getId())) {
                return ResponseEntity.status(403).build();
            }
        }

        taskCategoryRepository.delete(cat);
        return ResponseEntity.noContent().build();
    }

    /** Simple request DTO for category creation */
    @Data
    public static class CategoryRequest {
        private String name;
    }
}
