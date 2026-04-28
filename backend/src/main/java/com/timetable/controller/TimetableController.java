package com.timetable.controller;

import com.timetable.model.dto.TimetableRequest;
import com.timetable.model.entity.Timetable;
import com.timetable.model.entity.User;
import com.timetable.service.TimetableService;
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

@RestController
@RequestMapping("/api/timetables")
@RequiredArgsConstructor
@Tag(name = "Timetables", description = "Create and manage timetables")
@SecurityRequirement(name = "bearerAuth")
public class TimetableController {

    private final TimetableService timetableService;
    private final UserService userService;

    @PostMapping
    @Operation(summary = "Create a timetable")
    public ResponseEntity<Timetable> create(@AuthenticationPrincipal UserDetails ud,
            @Valid @RequestBody TimetableRequest req) {
        return ResponseEntity.status(201).body(timetableService.createTimetable(getUser(ud).getId(), req));
    }

    @GetMapping
    @Operation(summary = "Get all timetables (filtered by workspace)")
    public ResponseEntity<List<Timetable>> getAll(
            @AuthenticationPrincipal UserDetails ud,
            @RequestParam(required = false) Long workspaceId) {
        return ResponseEntity.ok(timetableService.getUserTimetables(getUser(ud).getId(), workspaceId));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a timetable by ID")
    public ResponseEntity<Timetable> getById(@AuthenticationPrincipal UserDetails ud, @PathVariable Long id) {
        return ResponseEntity.ok(timetableService.getTimetableById(id, getUser(ud).getId()));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a timetable")
    public ResponseEntity<Timetable> update(@AuthenticationPrincipal UserDetails ud,
            @PathVariable Long id, @Valid @RequestBody TimetableRequest req) {
        return ResponseEntity.ok(timetableService.updateTimetable(id, getUser(ud).getId(), req));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a timetable")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal UserDetails ud, @PathVariable Long id) {
        timetableService.deleteTimetable(id, getUser(ud).getId());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/share")
    @Operation(summary = "Toggle public sharing for a timetable")
    public ResponseEntity<Timetable> toggleShare(
            @AuthenticationPrincipal UserDetails ud,
            @PathVariable Long id,
            @RequestParam boolean isPublic) {
        return ResponseEntity.ok(timetableService.toggleSharing(id, getUser(ud).getId(), isPublic));
    }

    @GetMapping("/shared/{token}")
    @Operation(summary = "Get a shared timetable by token (Public)")
    public ResponseEntity<Timetable> getShared(@PathVariable String token) {
        return ResponseEntity.ok(timetableService.getByShareToken(token));
    }

    private User getUser(UserDetails ud) {
        return userService.getUserByEmail(ud.getUsername());
    }
}
