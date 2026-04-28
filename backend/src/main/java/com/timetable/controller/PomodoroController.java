package com.timetable.controller;

import com.timetable.model.entity.PomodoroSession;
import com.timetable.model.entity.User;
import com.timetable.service.PomodoroService;
import com.timetable.service.UserService;
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
@RequestMapping("/api/pomodoro")
@RequiredArgsConstructor
@Tag(name = "Pomodoro", description = "Pomodoro timer session tracking")
@SecurityRequirement(name = "bearerAuth")
public class PomodoroController {

    private final PomodoroService pomodoroService;
    private final UserService userService;

    @PostMapping("/start")
    @Operation(summary = "Start a Pomodoro session")
    public ResponseEntity<PomodoroSession> start(
            @AuthenticationPrincipal UserDetails ud,
            @RequestBody Map<String, Object> body) {
        Long taskId = body.get("taskId") != null ? Long.parseLong(body.get("taskId").toString()) : null;
        String typeStr = body.getOrDefault("type", "WORK").toString();
        PomodoroSession.SessionType type = PomodoroSession.SessionType.valueOf(typeStr);
        return ResponseEntity.status(201).body(pomodoroService.startSession(getUser(ud).getId(), taskId, type));
    }

    @PostMapping("/{id}/complete")
    @Operation(summary = "Mark a Pomodoro session as completed")
    public ResponseEntity<PomodoroSession> complete(
            @AuthenticationPrincipal UserDetails ud,
            @PathVariable Long id) {
        return ResponseEntity.ok(pomodoroService.completeSession(id, getUser(ud).getId()));
    }

    @GetMapping
    @Operation(summary = "Get all Pomodoro sessions")
    public ResponseEntity<List<PomodoroSession>> getAll(@AuthenticationPrincipal UserDetails ud) {
        return ResponseEntity.ok(pomodoroService.getUserSessions(getUser(ud).getId()));
    }

    @GetMapping("/config")
    @Operation(summary = "Get Pomodoro timer configuration")
    public ResponseEntity<Map<String, Integer>> config() {
        return ResponseEntity.ok(Map.of(
                "workDurationMinutes", pomodoroService.getWorkDuration(),
                "shortBreakMinutes", pomodoroService.getShortBreak(),
                "longBreakMinutes", pomodoroService.getLongBreak()));
    }

    private User getUser(UserDetails ud) {
        return userService.getUserByEmail(ud.getUsername());
    }
}
