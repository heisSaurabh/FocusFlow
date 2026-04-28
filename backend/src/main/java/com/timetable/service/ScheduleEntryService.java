package com.timetable.service;

import com.timetable.exception.ResourceNotFoundException;
import com.timetable.model.dto.ScheduleEntryRequest;
import com.timetable.model.dto.ScheduleEntryResponse;
import com.timetable.model.entity.ScheduleEntry;
import com.timetable.model.entity.Task;
import com.timetable.model.entity.Timetable;
import com.timetable.repository.ScheduleEntryRepository;
import com.timetable.repository.TaskRepository;
import com.timetable.repository.TimetableRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for ScheduleEntry CRUD with conflict detection.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ScheduleEntryService {

    private final ScheduleEntryRepository entryRepository;
    private final TimetableRepository timetableRepository;
    private final TaskRepository taskRepository;

    @Transactional
    public ScheduleEntryResponse addEntry(Long timetableId, Long userId, ScheduleEntryRequest request) {
        Timetable timetable = timetableRepository.findByIdAndUserId(timetableId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Timetable", timetableId));

        // Check for scheduling conflicts
        List<ScheduleEntry> conflicts = entryRepository.findConflicts(
                timetableId, request.getDayOfWeek(),
                request.getStartTime(), request.getEndTime(), -1L);

        if (!conflicts.isEmpty()) {
            throw new IllegalArgumentException(
                    "Schedule conflict detected at " + request.getStartTime() + " - " + request.getEndTime());
        }

        Task task = null;
        if (request.getTaskId() != null) {
            task = taskRepository.findById(request.getTaskId()).orElse(null);
        }

        ScheduleEntry entry = ScheduleEntry.builder()
                .timetable(timetable)
                .task(task)
                .title(request.getTitle())
                .description(request.getDescription())
                .dayOfWeek(request.getDayOfWeek())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .isRecurring(request.getIsRecurring() != null ? request.getIsRecurring() : false)
                .build();

        return toResponse(entryRepository.save(entry));
    }

    public List<ScheduleEntryResponse> getEntries(Long timetableId, Long userId) {
        // Validate ownership
        timetableRepository.findByIdAndUserId(timetableId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Timetable", timetableId));
        return entryRepository.findByTimetableId(timetableId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional
    public ScheduleEntryResponse updateEntry(Long entryId, Long userId, ScheduleEntryRequest request) {
        ScheduleEntry entry = entryRepository.findById(entryId)
                .orElseThrow(() -> new ResourceNotFoundException("ScheduleEntry", entryId));

        // Validate user owns the timetable
        if (!entry.getTimetable().getUser().getId().equals(userId)) {
            throw new com.timetable.exception.UnauthorizedException("You don't own this entry");
        }

        if (request.getTitle() != null)
            entry.setTitle(request.getTitle());
        if (request.getDescription() != null)
            entry.setDescription(request.getDescription());
        if (request.getDayOfWeek() != null)
            entry.setDayOfWeek(request.getDayOfWeek());
        if (request.getStartTime() != null)
            entry.setStartTime(request.getStartTime());
        if (request.getEndTime() != null)
            entry.setEndTime(request.getEndTime());
        if (request.getIsRecurring() != null)
            entry.setIsRecurring(request.getIsRecurring());

        return toResponse(entryRepository.save(entry));
    }

    @Transactional
    public void deleteEntry(Long entryId, Long userId) {
        ScheduleEntry entry = entryRepository.findById(entryId)
                .orElseThrow(() -> new ResourceNotFoundException("ScheduleEntry", entryId));
        if (!entry.getTimetable().getUser().getId().equals(userId)) {
            throw new com.timetable.exception.UnauthorizedException("You don't own this entry");
        }
        entryRepository.delete(entry);
    }

    public ScheduleEntryResponse toResponse(ScheduleEntry e) {
        return ScheduleEntryResponse.builder()
                .id(e.getId())
                .timetableId(e.getTimetable().getId())
                .taskId(e.getTask() != null ? e.getTask().getId() : null)
                .title(e.getTitle())
                .description(e.getDescription())
                .dayOfWeek(e.getDayOfWeek())
                .startTime(e.getStartTime())
                .endTime(e.getEndTime())
                .isRecurring(e.getIsRecurring())
                .isAiGenerated(e.getIsAiGenerated())
                .createdAt(e.getCreatedAt())
                .build();
    }
}
