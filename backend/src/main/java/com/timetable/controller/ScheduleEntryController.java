package com.timetable.controller;

import com.timetable.model.dto.ScheduleEntryRequest;
import com.timetable.model.dto.ScheduleEntryResponse;
import com.timetable.model.entity.User;
import com.timetable.service.ScheduleEntryService;
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
@RequestMapping("/api/timetables/{timetableId}/entries")
@RequiredArgsConstructor
@Tag(name = "Schedule Entries", description = "Manage time blocks within a timetable")
@SecurityRequirement(name = "bearerAuth")
public class ScheduleEntryController {

    private final ScheduleEntryService entryService;
    private final UserService userService;

    @PostMapping
    @Operation(summary = "Add a schedule entry")
    public ResponseEntity<ScheduleEntryResponse> add(@AuthenticationPrincipal UserDetails ud,
            @PathVariable Long timetableId,
            @Valid @RequestBody ScheduleEntryRequest req) {
        return ResponseEntity.status(201).body(entryService.addEntry(timetableId, getUser(ud).getId(), req));
    }

    @GetMapping
    @Operation(summary = "Get all entries for a timetable")
    public ResponseEntity<List<ScheduleEntryResponse>> getAll(@AuthenticationPrincipal UserDetails ud,
            @PathVariable Long timetableId) {
        return ResponseEntity.ok(entryService.getEntries(timetableId, getUser(ud).getId()));
    }

    @PutMapping("/{entryId}")
    @Operation(summary = "Update a schedule entry")
    public ResponseEntity<ScheduleEntryResponse> update(@AuthenticationPrincipal UserDetails ud,
            @PathVariable Long timetableId,
            @PathVariable Long entryId,
            @RequestBody ScheduleEntryRequest req) {
        return ResponseEntity.ok(entryService.updateEntry(entryId, getUser(ud).getId(), req));
    }

    @DeleteMapping("/{entryId}")
    @Operation(summary = "Delete a schedule entry")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal UserDetails ud,
            @PathVariable Long timetableId,
            @PathVariable Long entryId) {
        entryService.deleteEntry(entryId, getUser(ud).getId());
        return ResponseEntity.noContent().build();
    }

    private User getUser(UserDetails ud) {
        return userService.getUserByEmail(ud.getUsername());
    }
}
