package com.timetable.service;

import com.timetable.model.entity.*;
import com.timetable.model.entity.Task.Priority;
import com.timetable.model.entity.Task.Category;
import com.timetable.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.*;
import java.time.temporal.ChronoUnit;
import java.util.*;

/**
 * Service providing AI functionalities like smart scheduling and task prioritization.
 * Leverages the local IntelligenceCore and LLM capabilities.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AiService {

    private final TaskRepository taskRepository;
    private final AiInsightRepository aiInsightRepository;
    private final UserRepository userRepository;
    private final IntelligenceCore intelligenceCore;
    private final dev.langchain4j.model.chat.ChatLanguageModel chatLanguageModel;

    /**
     * Checks the operational status of the AI engine.
     */
    public Map<String, Object> getStatus() {
        Map<String, Object> statusMap = new LinkedHashMap<>();
        statusMap.put("internet", true);
        statusMap.put("gemini", false);
        statusMap.put("engine", "FOCUSFLOW_BRAIN");
        statusMap.put("apiKeyConfigured", false);
        return statusMap;
    }

    // ─── 1. Smart Schedule Generator ─────────────────────────────────────

    @Transactional
    public List<Map<String, Object>> generateSmartSchedule(Long userId) {
        List<Task> activeTasks = taskRepository.findActiveTasksForScheduling(userId);
        List<Map<String, Object>> proposedSlots = new ArrayList<>();

        LocalDateTime currentSlotStartTime = LocalDateTime.now().plusDays(1)
                .withHour(8).withMinute(0).withSecond(0).withNano(0);

        List<Task> sortedTasks = new ArrayList<>(activeTasks);
        sortedTasks.sort((t1, t2) -> {
            double score1 = t1.getAiScore() != null ? t1.getAiScore() : 0.0;
            double score2 = t2.getAiScore() != null ? t2.getAiScore() : 0.0;
            return Double.compare(score2, score1);
        });

        int limit = Math.min(10, sortedTasks.size());
        for (int i = 0; i < limit; i++) {
            Task task = sortedTasks.get(i);
            double estimatedDurationHours = task.getEstimatedHours() != null ? task.getEstimatedHours() : 1.0;
            LocalDateTime currentSlotEndTime = currentSlotStartTime.plusMinutes((long) (estimatedDurationHours * 60));

            Map<String, Object> scheduleEntry = new LinkedHashMap<>();
            scheduleEntry.put("taskId", task.getId());
            scheduleEntry.put("taskTitle", task.getTitle());
            scheduleEntry.put("priority", task.getPriority());
            scheduleEntry.put("suggestedStart", currentSlotStartTime.toString());
            scheduleEntry.put("suggestedEnd", currentSlotEndTime.toString());
            scheduleEntry.put("dayOfWeek", currentSlotStartTime.getDayOfWeek().getValue() % 7);
            scheduleEntry.put("reason", createScheduleRationale(task));
            proposedSlots.add(scheduleEntry);

            currentSlotStartTime = currentSlotEndTime.plusMinutes(15);

            if (currentSlotStartTime.getHour() >= 12 && currentSlotStartTime.getHour() < 13) {
                currentSlotStartTime = currentSlotStartTime.withHour(13).withMinute(0);
            }
            if (currentSlotStartTime.getHour() >= 18) {
                currentSlotStartTime = currentSlotStartTime.plusDays(1).withHour(8).withMinute(0);
            }
        }

        saveInsight(userId, AiInsight.InsightType.SCHEDULE_SUGGESTION,
                "Generated " + proposedSlots.size() + " schedule slots for your active tasks.", null);
        return proposedSlots;
    }

    private String createScheduleRationale(Task task) {
        if (task.getDeadline() != null) {
            long daysUntilDeadline = ChronoUnit.DAYS.between(LocalDate.now(), task.getDeadline());
            if (daysUntilDeadline <= 1) {
                return "⚠️ Due very soon! Scheduled with highest priority.";
            }
            if (daysUntilDeadline <= 3) {
                return "📌 Deadline in " + daysUntilDeadline + " days — scheduled early.";
            }
        }
        return switch (task.getPriority()) {
            case URGENT -> "🔥 Urgent priority — front-loaded in schedule.";
            case HIGH -> "⬆️ High priority task.";
            case MEDIUM -> "📋 Medium priority — scheduled in order.";
            case LOW -> "📝 Low priority — scheduled when time permits.";
        };
    }

    // ─── 2. Task Prioritization ───────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<Map<String, Object>> prioritizeTasks(Long userId) {
        List<Task> tasks = taskRepository.findActiveTasksForScheduling(userId);
        List<Map<String, Object>> prioritizedList = new ArrayList<>();

        for (Task task : tasks) {
            double score = calculatePriorityScore(task);
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("taskId", task.getId());
            result.put("title", task.getTitle());
            result.put("priority", task.getPriority());
            result.put("category", task.getCategoryEnum());
            result.put("deadline", task.getDeadline());
            result.put("aiScore", Math.round(score * 10.0) / 10.0);
            result.put("recommendation", determineRecommendation(task, score));
            prioritizedList.add(result);
        }

        prioritizedList.sort((a, b) -> Double.compare((Double) b.get("aiScore"), (Double) a.get("aiScore")));
        return prioritizedList;
    }

    private double calculatePriorityScore(Task task) {
        double baseScore = switch (task.getPriority()) {
            case URGENT -> 100.0;
            case HIGH -> 75.0;
            case MEDIUM -> 50.0;
            case LOW -> 25.0;
        };
        
        double urgencyMultiplier = 1.0;
        if (task.getDeadline() != null) {
            long daysRemaining = ChronoUnit.DAYS.between(LocalDate.now(), task.getDeadline());
            if (daysRemaining < 0) {
                urgencyMultiplier = 2.5;
            } else if (daysRemaining == 0) {
                urgencyMultiplier = 2.0;
            } else if (daysRemaining <= 3) {
                urgencyMultiplier = 1.7;
            } else if (daysRemaining <= 7) {
                urgencyMultiplier = 1.3;
            }
        }
        
        double categoryMultiplier = (task.getCategoryEnum() == Category.STUDY || task.getCategoryEnum() == Category.WORK) ? 1.1 : 1.0;
        return Math.min(100.0, baseScore * urgencyMultiplier * categoryMultiplier);
    }

    private String determineRecommendation(Task task, double score) {
        if (score >= 90) return "🔴 Do this NOW — critical and overdue or urgent deadline!";
        if (score >= 70) return "🟠 Do this TODAY — high priority with approaching deadline.";
        if (score >= 50) return "🟡 Schedule this week — important but has some buffer.";
        return "🟢 Can be deferred — low urgency.";
    }

    // ─── 3. Productivity Insights ─────────────────────────────────────────

    @Transactional
    public List<String> getProductivityInsights(Long userId) {
        List<String> insightList = new ArrayList<>();
        LocalDateTime weekAgo = LocalDateTime.now().minusDays(7);
        LocalDateTime now = LocalDateTime.now();

        long completedTaskCount = taskRepository.countCompletedBetween(userId, weekAgo, now);
        List<Task> allActive = taskRepository.findActiveTasksForScheduling(userId);
        
        long overdueTaskCount = 0;
        long highPriorityCount = 0;
        Map<Category, Long> tasksByCategory = new HashMap<>();

        for (Task t : allActive) {
            if (t.getDeadline() != null && t.getDeadline().isBefore(LocalDate.now())) {
                overdueTaskCount++;
            }
            if (t.getPriority() == Priority.HIGH || t.getPriority() == Priority.URGENT) {
                highPriorityCount++;
            }
            Category cat = t.getCategoryEnum();
            tasksByCategory.put(cat, tasksByCategory.getOrDefault(cat, 0L) + 1);
        }

        if (completedTaskCount == 0) {
            insightList.add("📊 You haven't completed any tasks this week. Try breaking large tasks into smaller ones.");
        } else if (completedTaskCount >= 5) {
            insightList.add("🌟 Great week! You completed " + completedTaskCount + " tasks. Keep up the momentum!");
        } else {
            insightList.add("✅ You completed " + completedTaskCount + " tasks this week. Try to aim for at least 5.");
        }

        if (overdueTaskCount > 0) {
            insightList.add("⚠️ You have " + overdueTaskCount + " overdue tasks. Consider rescheduling or breaking them down.");
        }

        if (highPriorityCount > 5) {
            insightList.add("🔥 You have " + highPriorityCount + " high-priority tasks. Try delegating or deferring lower-impact items.");
        }

        if (tasksByCategory.getOrDefault(Category.STUDY, 0L) > 0 && tasksByCategory.getOrDefault(Category.PERSONAL, 0L) == 0) {
            insightList.add("💆 You have no personal tasks scheduled. Work-life balance is important for long-term productivity.");
        }

        insightList.add("🍅 Use the Pomodoro timer: 25 min focus + 5 min break cycles to maximize deep work.");
        insightList.add("🌙 Tip: Schedule your hardest tasks during your peak energy hours (usually morning).");

        saveInsight(userId, AiInsight.InsightType.PRODUCTIVITY_TIP, String.join(" | ", insightList), null);
        return insightList;
    }

    @Transactional
    public List<String> decomposeTask(Long userId, String taskTitle) {
        String prompt = String.format(
            "Act as a productivity expert. Break down the following task into 5 clear, actionable sub-tasks: '%s'. " +
            "Provide only the list of sub-tasks, one per line, no introductory text.", taskTitle
        );

        String response;
        try {
            response = chatLanguageModel.generate(prompt);
        } catch (Exception e) {
            log.warn("LLM task decomposition failed, using fallback heuristics: {}", e.getMessage());
            return List.of(
                "Step 1: Research and Planning",
                "Step 2: Core Implementation",
                "Step 3: Initial Testing",
                "Step 4: Refinement and Polish",
                "Step 5: Final Review"
            );
        }

        saveInsight(userId, AiInsight.InsightType.PRODUCTIVITY_TIP, "Decomposed task: " + taskTitle, taskTitle);
        
        List<String> subTasks = new ArrayList<>();
        if (response != null && !response.isBlank()) {
            String[] lines = response.split("\n");
            for (String line : lines) {
                if (!line.isBlank()) {
                    subTasks.add(line.replaceAll("^\\d+\\.\\s*", "").trim());
                }
            }
        }
        
        return subTasks.size() > 5 ? subTasks.subList(0, 5) : subTasks;
    }

    // ─── 4. Natural Language Input Parser ────────────────────────────────

    @Transactional
    public Map<String, Object> parseNaturalLanguage(Long userId, String input) {
        Map<String, Object> parsed = intelligenceCore.parseNlpCommand(input);
        saveInsight(userId, AiInsight.InsightType.NLP_PARSE, "Parsed: " + parsed.get("title") + " on " + parsed.get("date"), input);
        return parsed;
    }

    // ─── 5. AI Chatbot (Custom Core) ─────────────────────────────────────

    @Transactional
    public String chat(Long userId, String userMessage) {
        String response;
        try {
            response = chatLanguageModel.generate(userMessage);
        } catch (Exception e) {
            log.warn("Local LLM unavailable, falling back to heuristic model: {}", e.getMessage());
            response = intelligenceCore.getChatResponse(userId, userMessage);
        }
        
        saveInsight(userId, AiInsight.InsightType.CHATBOT_RESPONSE, response, userMessage, "FOCUSFLOW_LLM");
        return response;
    }

    @Transactional
    public Map<String, Object> chatOrNlp(Long userId, String input) {
        Map<String, Object> result = new LinkedHashMap<>();
        if (intelligenceCore.isNlpCommand(input)) {
            Map<String, Object> parsed = parseNaturalLanguage(userId, input);
            result.put("type", "NLP");
            result.put("parsed", parsed);
            result.put("response", "Got it! I parsed your command. Here's what I found — confirm to create the task:");
        } else {
            String chatReply = chat(userId, input);
            result.put("type", "CHAT");
            result.put("response", chatReply);
        }
        return result;
    }

    @Transactional
    public void learnCorrection(Long userId, String userQuery, String actualIntent) {
        intelligenceCore.learnCorrection(userId, userQuery, actualIntent);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────

    private void saveInsight(Long userId, AiInsight.InsightType type, String content, String query) {
        saveInsight(userId, type, content, query, "FOCUSFLOW_BRAIN");
    }

    private void saveInsight(Long userId, AiInsight.InsightType type, String content, String query, String engine) {
        userRepository.findById(userId).ifPresent(user -> {
            AiInsight insight = AiInsight.builder()
                    .user(user).type(type).content(content)
                    .userQuery(query).engine(engine)
                    .build();
            aiInsightRepository.save(insight);
        });
    }

    public List<AiInsight> getInsightHistory(Long userId) {
        return aiInsightRepository.findTop10ByUserIdOrderByCreatedAtDesc(userId);
    }
}
