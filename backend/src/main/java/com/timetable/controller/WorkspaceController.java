package com.timetable.controller;

import com.timetable.model.entity.User;
import com.timetable.model.entity.Workspace;
import com.timetable.service.UserService;
import com.timetable.service.WorkspaceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/workspaces")
@RequiredArgsConstructor
@Tag(name = "Workspaces", description = "Organizational units for partitioning tasks and schedules (v3.0)")
@SecurityRequirement(name = "bearerAuth")
public class WorkspaceController {

    private final WorkspaceService workspaceService;
    private final UserService userService;

    @GetMapping
    @Operation(summary = "List all workspaces for the current user")
    public ResponseEntity<List<Workspace>> list(@AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(workspaceService.getUserWorkspaces(getUser(ud).getId()));
    }

    @PostMapping
    @Operation(summary = "Create a new workspace")
    public ResponseEntity<Workspace> create(
            @AuthenticationPrincipal UserDetails ud,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(workspaceService.createWorkspace(
                getUser(ud),
                body.get("name"),
                body.get("description")
        ));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a workspace")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal UserDetails ud,
            @PathVariable Long id) {
        workspaceService.deleteWorkspace(getUser(ud).getId(), id);
        return ResponseEntity.noContent().build();
    }

    private User getUser(UserDetails ud) {
        return userService.getUserByEmail(ud.getUsername());
    }
}
