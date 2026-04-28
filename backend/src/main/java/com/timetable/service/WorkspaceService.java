package com.timetable.service;

import com.timetable.model.entity.User;
import com.timetable.model.entity.Workspace;
import com.timetable.repository.WorkspaceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class WorkspaceService {

    private final WorkspaceRepository workspaceRepository;

    @Transactional(readOnly = true)
    public List<Workspace> getUserWorkspaces(Long userId) {
        return workspaceRepository.findAllByOwnerId(userId);
    }

    @Transactional
    public Workspace createWorkspace(User user, String name, String description) {
        Workspace ws = Workspace.builder()
                .name(name)
                .description(description)
                .owner(user)
                .build();
        return workspaceRepository.save(ws);
    }

    @Transactional
    public void deleteWorkspace(Long userId, Long workspaceId) {
        Workspace ws = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new RuntimeException("Workspace not found"));
        
        if (!ws.getOwner().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized to delete this workspace");
        }
        
        workspaceRepository.delete(ws);
    }
}
