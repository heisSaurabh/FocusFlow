package com.timetable.controller;

import com.timetable.model.entity.User;
import com.timetable.service.AiService;
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

/**
 * Controller for handling all AI-related interactions.
 * Provides endpoints for smart scheduling, task prioritization, and conversational assistance.
 */
@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@Tag(name = "AI Features", description = "Endpoints for smart productivity enhancements")
@SecurityRequirement(name = "bearerAuth")
public class AiController {

    private final AiService aiService;
    private final UserService userService;

    @GetMapping("/schedule")
    @Operation(summary = "Generate a smart schedule based on current tasks")
    public ResponseEntity<List<Map<String, Object>>> getSmartSchedule(@AuthenticationPrincipal UserDetails currentUser) {
        User user = resolveUser(currentUser);
        return ResponseEntity.ok(aiService.generateSmartSchedule(user.getId()));
    }

    @GetMapping("/prioritize")
    @Operation(summary = "Retrieve an AI-prioritized task list")
    public ResponseEntity<List<Map<String, Object>>> getPrioritizedTasks(@AuthenticationPrincipal UserDetails currentUser) {
        User user = resolveUser(currentUser);
        return ResponseEntity.ok(aiService.prioritizeTasks(user.getId()));
    }

    @GetMapping("/insights")
    @Operation(summary = "Fetch personalized productivity insights")
    public ResponseEntity<List<String>> getProductivityInsights(@AuthenticationPrincipal UserDetails currentUser) {
        User user = resolveUser(currentUser);
        return ResponseEntity.ok(aiService.getProductivityInsights(user.getId()));
    }

    @PostMapping("/parse")
    @Operation(summary = "Parse natural language input into structured schedule items")
    public ResponseEntity<Map<String, Object>> parseInput(
            @AuthenticationPrincipal UserDetails currentUser,
            @RequestBody Map<String, String> payload) {
        String textInput = payload.get("text");
        if (textInput == null || textInput.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        User user = resolveUser(currentUser);
        return ResponseEntity.ok(aiService.parseNaturalLanguage(user.getId(), textInput));
    }

    @PostMapping("/decompose")
    @Operation(summary = "Break down a complex task into smaller sub-tasks")
    public ResponseEntity<List<String>> breakDownTask(
            @AuthenticationPrincipal UserDetails currentUser,
            @RequestBody Map<String, String> payload) {
        String taskTitle = payload.get("title");
        if (taskTitle == null || taskTitle.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        User user = resolveUser(currentUser);
        return ResponseEntity.ok(aiService.decomposeTask(user.getId(), taskTitle));
    }

    @PostMapping("/chat")
    @Operation(summary = "Interact with the AI productivity assistant")
    public ResponseEntity<Map<String, String>> converseWithAi(
            @AuthenticationPrincipal UserDetails currentUser,
            @RequestBody Map<String, String> payload) {
        String userMessage = payload.get("message");
        if (userMessage == null || userMessage.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        User user = resolveUser(currentUser);
        String aiResponse = aiService.chat(user.getId(), userMessage);
        return ResponseEntity.ok(Map.of("response", aiResponse));
    }

    @PostMapping("/chat-nlp")
    @Operation(summary = "Smart chat that distinguishes between commands and queries")
    public ResponseEntity<Map<String, Object>> processSmartChat(
            @AuthenticationPrincipal UserDetails currentUser,
            @RequestBody Map<String, String> payload) {
        String userMessage = payload.get("message");
        if (userMessage == null || userMessage.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        User user = resolveUser(currentUser);
        return ResponseEntity.ok(aiService.chatOrNlp(user.getId(), userMessage));
    }

    @GetMapping("/history")
    @Operation(summary = "Retrieve history of generated insights")
    public ResponseEntity<?> getInsightLog(@AuthenticationPrincipal UserDetails currentUser) {
        User user = resolveUser(currentUser);
        return ResponseEntity.ok(aiService.getInsightHistory(user.getId()));
    }

    @PostMapping("/feedback")
    @Operation(summary = "Provide feedback to improve AI accuracy")
    public ResponseEntity<?> submitAiFeedback(
            @AuthenticationPrincipal UserDetails currentUser,
            @RequestBody Map<String, String> payload) {
        String originalQuery = payload.get("query");
        String correctIntent = payload.get("correctIntent");
        if (originalQuery == null || correctIntent == null) {
            return ResponseEntity.badRequest().build();
        }
        User user = resolveUser(currentUser);
        aiService.learnCorrection(user.getId(), originalQuery, correctIntent);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/status")
    @Operation(summary = "Check the operational status of the AI engine")
    public ResponseEntity<Map<String, Object>> checkEngineStatus() {
        return ResponseEntity.ok(aiService.getStatus());
    }

    private User resolveUser(UserDetails userDetails) {
        return userService.getUserByEmail(userDetails.getUsername());
    }
}
