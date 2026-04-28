package com.timetable.controller;

import com.timetable.model.entity.User;
import com.timetable.service.AnalyticsService;
import com.timetable.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * Controller for retrieving user productivity analytics and statistics.
 */
@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
@Tag(name = "Analytics", description = "Endpoints for productivity scores and metrics")
@SecurityRequirement(name = "bearerAuth")
public class AnalyticsController {

    private final AnalyticsService analyticsService;
    private final UserService userService;

    @GetMapping("/score")
    @Operation(summary = "Fetch productivity score for the past 7 days")
    public ResponseEntity<Map<String, Object>> getRecentProductivityScore(@AuthenticationPrincipal UserDetails userDetails) {
        User user = fetchUser(userDetails);
        return ResponseEntity.ok(analyticsService.getProductivityScore(user.getId()));
    }

    @GetMapping("/categories")
    @Operation(summary = "Get time distribution across categories for the last 30 days")
    public ResponseEntity<List<Map<String, Object>>> getCategoryTimeDistribution(@AuthenticationPrincipal UserDetails userDetails) {
        User user = fetchUser(userDetails);
        return ResponseEntity.ok(analyticsService.getTimeByCategory(user.getId()));
    }

    @GetMapping("/weekly")
    @Operation(summary = "Retrieve weekly task completion data for the last 4 weeks")
    public ResponseEntity<List<Map<String, Object>>> getWeeklyCompletionReport(@AuthenticationPrincipal UserDetails userDetails) {
        User user = fetchUser(userDetails);
        return ResponseEntity.ok(analyticsService.getWeeklyReport(user.getId()));
    }

    @GetMapping("/pomodoro")
    @Operation(summary = "Fetch statistics on Pomodoro sessions for the current week")
    public ResponseEntity<Map<String, Object>> getPomodoroStatistics(@AuthenticationPrincipal UserDetails userDetails) {
        User user = fetchUser(userDetails);
        return ResponseEntity.ok(analyticsService.getPomodoroStats(user.getId()));
    }

    @GetMapping("/report")
    @Operation(summary = "Get an aggregated overview of all productivity metrics")
    public ResponseEntity<Map<String, Object>> aggregateOverallMetrics(@AuthenticationPrincipal UserDetails userDetails) {
        User user = fetchUser(userDetails);
        return ResponseEntity.ok(analyticsService.getOverallReport(user.getId()));
    }

    private User fetchUser(UserDetails details) {
        return userService.getUserByEmail(details.getUsername());
    }
}
