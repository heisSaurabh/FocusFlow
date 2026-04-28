package com.timetable.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.timetable.model.entity.LearnedKnowledge;
import com.timetable.model.entity.User;
import com.timetable.repository.LearnedKnowledgeRepository;
import com.timetable.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class IntelligenceCore {

    private final LearnedKnowledgeRepository learnedKnowledgeRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private JsonNode brainData;

    @PostConstruct
    public void init() {
        try {
            ClassPathResource resource = new ClassPathResource("ai/brain.json");
            brainData = objectMapper.readTree(resource.getInputStream());
            log.info("FocusFlow Brain (Local AI) initialized successfully.");
        } catch (Exception e) {
            log.error("Failed to load brain.json. Local AI might not function correctly.", e);
        }
    }

    /**
     * Determines the optimal rule-based chat response by scoring intents against user input.
     * Incorporates learned corrections.
     */
    public String getChatResponse(Long userId, String userMessage) {
        String lowerMessage = userMessage.toLowerCase().replaceAll("[^a-z0-9 ]", "");
        
        // 1. Check Learner Engine (highest priority)
        List<LearnedKnowledge> learned = learnedKnowledgeRepository.findByUserId(userId);
        for (LearnedKnowledge k : learned) {
            if (calculateSimilarity(lowerMessage, k.getUserQuery().toLowerCase()) >= 0.8) {
                // Return the response for the corrected intent
                String response = getResponseForIntent(k.getCorrectedIntent());
                if (response != null) {
                    return "[(Learned) Ah, you meant this before:] " + response;
                }
            }
        }

        // 2. Score against brain.json intents
        double bestScore = 0;
        String bestIntentId = null;
        String bestResponse = null;

        if (brainData != null && brainData.has("intents")) {
            for (JsonNode intent : brainData.get("intents")) {
                double currentScore = 0;
                for (JsonNode keywordNode : intent.get("keywords")) {
                    String keyword = keywordNode.asText().toLowerCase();
                    // Basic contain or fuzzy match
                    if (lowerMessage.contains(keyword)) {
                        currentScore += 1.0;
                    } else if (calculateSimilarity(lowerMessage, keyword) > 0.4) {
                        currentScore += 0.5; // fuzzy partial bonus
                    }
                }
                
                if (currentScore > bestScore) {
                    bestScore = currentScore;
                    bestIntentId = intent.get("id").asText();
                    bestResponse = intent.get("response").asText();
                }
            }
        }

        if (bestScore > 0) {
            return bestResponse;
        }

        // 3. Fallback
        return brainData != null && brainData.has("fallback") 
            ? brainData.get("fallback").asText() 
            : "I'm still learning! Ask me about Focus, Procrastination, or Scheduling.";
    }

    private String getResponseForIntent(String intentId) {
        if (brainData != null && brainData.has("intents")) {
            for (JsonNode intent : brainData.get("intents")) {
                if (intent.get("id").asText().equals(intentId)) {
                    return intent.get("response").asText();
                }
            }
        }
        return null;
    }

    /**
     * Returns true if the input looks like a natural-language task/schedule command.
     */
    public boolean isNlpCommand(String input) {
        if (input == null || input.length() < 6) return false;
        String lower = input.toLowerCase();
        boolean hasTime = lower.matches(".*\\bat\\s+\\d{1,2}.*") || lower.contains("am") || lower.contains("pm");
        boolean hasTemporal = lower.contains("tomorrow") || lower.contains("today") || lower.contains("next week") || lower.contains("monday") || lower.contains("tuesday") || lower.contains("wednesday") || lower.contains("thursday") || lower.contains("friday") || lower.contains("saturday") || lower.contains("sunday");
        boolean hasAction = lower.startsWith("add ") || lower.startsWith("schedule ") || lower.startsWith("remind ") || lower.startsWith("create task") || lower.startsWith("new task");
        return hasAction || (hasTime && hasTemporal) || (hasTime && input.split(" ").length <= 8);
    }

    /**
     * Parse natural language into Task Data.
     */
    public Map<String, Object> parseNlpCommand(String input) {
        Map<String, Object> parsed = new LinkedHashMap<>();
        parsed.put("originalInput", input);
        String lower = input.toLowerCase();

        String title = input.replaceAll("(?i)\\s*(at|from|on|tomorrow|today|next week|for\\s+\\d+\\s+(hour|min).*).*", "").trim();
        if (title.toLowerCase().startsWith("create task") || title.toLowerCase().startsWith("schedule")) {
             title = title.replaceAll("(?i)^(create task|schedule)\\s+(to\\s+)?", "");
        }
        if (title.isEmpty()) title = input;
        parsed.put("title", capitalizeFirst(title));

        // Time logic: at 5 PM, at 17:00
        Pattern timePattern = Pattern.compile("(?i)at\\s*(\\d{1,2})(?::(\\d{2}))?\\s*(am|pm)?");
        Matcher timeMatcher = timePattern.matcher(input);
        if (timeMatcher.find()) {
            int hour = Integer.parseInt(timeMatcher.group(1));
            int minute = timeMatcher.group(2) != null ? Integer.parseInt(timeMatcher.group(2)) : 0;
            String ampm = timeMatcher.group(3);
            if (ampm != null && ampm.equalsIgnoreCase("pm") && hour < 12) hour += 12;
            if (ampm != null && ampm.equalsIgnoreCase("am") && hour == 12) hour = 0;
            parsed.put("startTime", String.format("%02d:%02d", hour, minute));
            parsed.put("endTime", String.format("%02d:%02d", (hour + 1) % 24, minute));
        }

        // Date logic
        LocalDate date = LocalDate.now();
        if (lower.contains("tomorrow")) date = date.plusDays(1);
        else if (lower.contains("next week")) date = date.plusWeeks(1);
        else if (lower.contains("monday")) date = nextDayOfWeek(date, DayOfWeek.MONDAY);
        else if (lower.contains("tuesday")) date = nextDayOfWeek(date, DayOfWeek.TUESDAY);
        else if (lower.contains("wednesday")) date = nextDayOfWeek(date, DayOfWeek.WEDNESDAY);
        else if (lower.contains("thursday")) date = nextDayOfWeek(date, DayOfWeek.THURSDAY);
        else if (lower.contains("friday")) date = nextDayOfWeek(date, DayOfWeek.FRIDAY);
        else if (lower.contains("saturday")) date = nextDayOfWeek(date, DayOfWeek.SATURDAY);
        else if (lower.contains("sunday")) date = nextDayOfWeek(date, DayOfWeek.SUNDAY);
        
        parsed.put("date", date.toString());
        parsed.put("dayOfWeek", date.getDayOfWeek().getValue() % 7);

        // Tags logic
        if (lower.contains("study") || lower.contains("revision") || lower.contains("lecture")) parsed.put("category", "STUDY");
        else if (lower.contains("work") || lower.contains("meeting") || lower.contains("project")) parsed.put("category", "WORK");
        else if (lower.contains("exercise") || lower.contains("gym") || lower.contains("run")) parsed.put("category", "HEALTH");
        else parsed.put("category", "PERSONAL");

        if (lower.contains("urgent") || lower.contains("asap") || lower.contains("immediately")) parsed.put("priority", "URGENT");
        else if (lower.contains("important") || lower.contains("critical")) parsed.put("priority", "HIGH");
        else parsed.put("priority", "MEDIUM");

        // Duration logic
        parsed.put("estimatedHours", extractDuration(input));

        return parsed;
    }

    /**
     * Feedback loop endpoint: called when user corrects the AI.
     */
    @Transactional
    public void learnCorrection(Long userId, String userQuery, String actualIntent) {
        userRepository.findById(userId).ifPresent(user -> {
            LearnedKnowledge lk = LearnedKnowledge.builder()
                .user(user)
                .userQuery(userQuery)
                .correctedIntent(actualIntent)
                .build();
            learnedKnowledgeRepository.save(lk);
            log.info("FocusFlow Brain learned new pattern for user {}", userId);
        });
    }

    // --- Helpers ---

    private LocalDate nextDayOfWeek(LocalDate from, DayOfWeek target) {
        return from.with(java.time.temporal.TemporalAdjusters.nextOrSame(target));
    }

    private String capitalizeFirst(String s) {
        if (s == null || s.isEmpty()) return s;
        return Character.toUpperCase(s.charAt(0)) + s.substring(1);
    }

    /**
     * Enhanced NLP parser extract duration
     */
    private double extractDuration(String input) {
        Pattern durationPattern = Pattern.compile("(?i)for\\s+(\\d+(?:\\.\\d+)?)\\s*(hour|hr|minute|min)s?");
        Matcher m = durationPattern.matcher(input);
        if (m.find()) {
            double val = Double.parseDouble(m.group(1));
            if (m.group(2).startsWith("min")) return val / 60.0;
            return val;
        }
        return 1.0;
    }

    /** 
     * Jaro-like or simple Levenshtein-based similarity for string overlap 
     * Handles stemming better than exact match
     */
    private double calculateSimilarity(String s1, String s2) {
        String[] words1 = s1.split(" ");
        String[] words2 = s2.split(" ");
        if (words1.length == 0 || words2.length == 0) return 0.0;
        
        int matchCount = 0;
        for (String w1 : words1) {
            for (String w2 : words2) {
                // If one contains the other (stemming) or Levenshtein distance is very small
                if (w1.contains(w2) || w2.contains(w1) || levenshtein(w1, w2) <= 1) {
                    matchCount++;
                    break; 
                }
            }
        }
        int union = words1.length + words2.length - matchCount;
        return union == 0 ? 0 : (double) matchCount / union;
    }

    private int levenshtein(String a, String b) {
        int[] costs = new int[b.length() + 1];
        for (int j = 0; j < costs.length; j++) costs[j] = j;
        for (int i = 1; i <= a.length(); i++) {
            costs[0] = i;
            int nw = i - 1;
            for (int j = 1; j <= b.length(); j++) {
                int cj = Math.min(1 + Math.min(costs[j], costs[j - 1]), a.charAt(i - 1) == b.charAt(j - 1) ? nw : nw + 1);
                nw = costs[j];
                costs[j] = cj;
            }
        }
        return costs[b.length()];
    }
}
