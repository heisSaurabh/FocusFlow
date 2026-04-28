package com.timetable.repository;

import com.timetable.model.entity.Workspace;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface WorkspaceRepository extends JpaRepository<Workspace, Long> {
    List<Workspace> findAllByOwnerId(Long ownerId);
    Optional<Workspace> findBySlugAndOwnerId(String slug, Long ownerId);
}
