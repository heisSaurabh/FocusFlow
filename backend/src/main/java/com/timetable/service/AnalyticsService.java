package com.timetable.service;

import com.timetable.repository.PomodoroSessionRepository;
import com.timetable.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

/**
 * Analytics service computing productivity scores, category breakdowns, and
 * streaks.
 * All calculations are done in-database using JPQL (no paid service needed).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AnalyticsService {

    private final TaskRepository taskRepository;
    private final PomodoroSessionRepository pomodoroSessionRepository;

    /**
     * Compute overall productivity score for the past 7 days (0-100).
     * Formula: (completionRate × 50) + (focusMinutesFactor × 30) + (noOverdueFactor
     * × 20)
     */
    public Map<String, Object> getProductivityScore(Long userId) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime weekAgo = now.minusDays(7);

        // Completion rate
        long completed = taskRepository.countCompletedBetween(userId, weekAgo, now);
        List<com.timetable.model.entity.Task> active = taskRepository.findActiveTasksForScheduling(userId);
        long total = completed + active.size();
        double completionRate = total > 0 ? (double) completed / total : 0;

        // Focus time (Pomodoro)
        Long focusMinutes = pomodoroSessionRepository.sumFocusMinutes(userId, weekAgo, now);
        if (focusMinutes == null)
            focusMinutes = 0L;
        double focusFactor = Math.min(1.0, focusMinutes / (7 * 4 * 25.0)); // Target: 4 pomodoros/day

        // Overdue penalty
        long overdue = active.stream()
                .filter(t -> t.getDeadline() != null && t.getDeadline().isBefore(java.time.LocalDate.now()))
                .count();
        double noOverdueFactor = overdue == 0 ? 1.0 : Math.max(0, 1.0 - (overdue * 0.1));

        double score = (completionRate * 50) + (focusFactor * 30) + (noOverdueFactor * 20);
        score = Math.min(100, Math.round(score));

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("productivityScore", (int) score);
        result.put("tasksCompleted", completed);
        result.put("totalTasks", total);
        result.put("completionRate", Math.round(completionRate * 100) + "%");
        result.put("focusMinutes", focusMinutes);
        result.put("overdueCount", overdue);
        result.put("period", "Last 7 days");

        // Badge
        if (score >= 80)
            result.put("badge", "🏆 Productivity Champion");
        else if (score >= 60)
            result.put("badge", "⭐ On Track");
        else if (score >= 40)
            result.put("badge", "📈 Improving");
        else
            result.put("badge", "💪 Keep Going");

        return result;
    }

    /**
     * Time spent per category (using estimatedHours of completed tasks).
     */
    public List<Map<String, Object>> getTimeByCategory(Long userId) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime monthAgo = now.minusDays(30);

        List<Object[]> rawData = taskRepository.sumHoursByCategory(userId, monthAgo, now);
        List<Map<String, Object>> result = new ArrayList<>();

        for (Object[] row : rawData) {
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("category", row[0].toString());
            entry.put("hours", row[1] != null ? ((Number) row[1]).doubleValue() : 0.0);
            result.add(entry);
        }
        return result;
    }

    /**
     * Weekly task completion data for line/bar charts (last 4 weeks).
     */
    public List<Map<String, Object>> getWeeklyReport(Long userId) {
        List<Map<String, Object>> weeks = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        for (int w = 3; w >= 0; w--) {
            LocalDateTime from = now.minusWeeks(w + 1);
            LocalDateTime to = now.minusWeeks(w);
            long count = taskRepository.countCompletedBetween(userId, from, to);

            Map<String, Object> week = new LinkedHashMap<>();
            week.put("week", "Week " + (4 - w));
            week.put("completed", count);
            week.put("from", from.toLocalDate().toString());
            week.put("to", to.toLocalDate().toString());
            weeks.add(week);
        }
        return weeks;
    }

    /**
     * Pomodoro statistics for the current week.
     */
    public Map<String, Object> getPomodoroStats(Long userId) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime weekAgo = now.minusDays(7);

        Long sessions = pomodoroSessionRepository.countCompletedWorkSessions(userId, weekAgo, now);
        Long minutes = pomodoroSessionRepository.sumFocusMinutes(userId, weekAgo, now);

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("sessionsCompleted", sessions != null ? sessions : 0);
        stats.put("focusMinutes", minutes != null ? minutes : 0);
        stats.put("focusHours", minutes != null ? Math.round(minutes / 60.0 * 10) / 10.0 : 0);
        return stats;
    }

    /**
     * Consolidated overall analytics report aggregating all metrics into one response.
     */
    public Map<String, Object> getOverallReport(Long userId) {
        Map<String, Object> report = new LinkedHashMap<>();
        report.put("generatedAt", LocalDateTime.now().toString());
        report.put("productivityScore", getProductivityScore(userId));
        report.put("weeklyReport", getWeeklyReport(userId));
        report.put("categoryBreakdown", getTimeByCategory(userId));
        report.put("pomodoroStats", getPomodoroStats(userId));

        // Summary tier
        Map<String, Object> scoreData = getProductivityScore(userId);
        int score = scoreData.get("productivityScore") instanceof Integer i ? i : 0;
        String tier = score >= 80 ? "CHAMPION" : score >= 60 ? "ON_TRACK" : score >= 40 ? "IMPROVING" : "NEEDS_WORK";
        report.put("tier", tier);
        return report;
    }
}
