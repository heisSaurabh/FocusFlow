package com.timetable.service;

import com.timetable.exception.ResourceNotFoundException;
import com.timetable.exception.UnauthorizedException;
import com.timetable.model.dto.TimetableRequest;
import com.timetable.model.entity.Timetable;
import com.timetable.model.entity.User;
import com.timetable.repository.TimetableRepository;
import com.timetable.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service class that manages CRUD operations for Timetables.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TimetableService {

    private final TimetableRepository timetableRepository;
    private final UserRepository userRepository;

    @Transactional
    public Timetable createTimetable(Long userId, TimetableRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        Timetable timetable = Timetable.builder()
                .user(user)
                .name(request.getName())
                .description(request.getDescription())
                .type(request.getType() != null ? request.getType() : Timetable.TimetableType.WEEKLY)
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();

        // Support for v3.0 Workspaces
        if (request.getWorkspaceId() != null) {
            timetable.setWorkspace(com.timetable.model.entity.Workspace.builder().id(request.getWorkspaceId()).build());
        }

        Timetable savedTimetable = timetableRepository.save(timetable);
        log.info("Successfully created timetable for user {}", userId);
        return savedTimetable;
    }

    public List<Timetable> getUserTimetables(Long userId, Long workspaceId) {
        if (workspaceId != null) {
            return timetableRepository.findByUserIdAndWorkspaceIdOrderByCreatedAtDesc(userId, workspaceId);
        } else {
            return timetableRepository.findByUserIdAndWorkspaceIsNullOrderByCreatedAtDesc(userId);
        }
    }

    public Timetable getTimetableById(Long timetableId, Long userId) {
        return timetableRepository.findByIdAndUserId(timetableId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Timetable", timetableId));
    }

    @Transactional
    public Timetable updateTimetable(Long timetableId, Long userId, TimetableRequest request) {
        Timetable timetable = getTimetableById(timetableId, userId);
        
        if (request.getName() != null) {
            timetable.setName(request.getName());
        }
        if (request.getDescription() != null) {
            timetable.setDescription(request.getDescription());
        }
        if (request.getType() != null) {
            timetable.setType(request.getType());
        }
        if (request.getIsActive() != null) {
            timetable.setIsActive(request.getIsActive());
        }
        
        return timetableRepository.save(timetable);
    }

    @Transactional
    public void deleteTimetable(Long timetableId, Long userId) {
        Timetable timetable = getTimetableById(timetableId, userId);
        timetableRepository.delete(timetable);
    }

    @Transactional
    public Timetable toggleSharing(Long timetableId, Long userId, boolean isPublic) {
        Timetable timetable = getTimetableById(timetableId, userId);
        timetable.setIsPublic(isPublic);
        
        if (isPublic && timetable.getShareToken() == null) {
            timetable.setShareToken(java.util.UUID.randomUUID().toString().substring(0, 8));
        }
        
        return timetableRepository.save(timetable);
    }

    public Timetable getByShareToken(String token) {
        return timetableRepository.findByShareTokenAndIsPublicTrue(token)
                .orElseThrow(() -> new ResourceNotFoundException("Shared Timetable", 0L));
    }
}
