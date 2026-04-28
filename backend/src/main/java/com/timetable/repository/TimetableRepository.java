package com.timetable.repository;

import com.timetable.model.entity.Timetable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TimetableRepository extends JpaRepository<Timetable, Long> {

    List<Timetable> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<Timetable> findByUserIdAndWorkspaceIdOrderByCreatedAtDesc(Long userId, Long workspaceId);

    List<Timetable> findByUserIdAndWorkspaceIsNullOrderByCreatedAtDesc(Long userId);

    Optional<Timetable> findByIdAndUserId(Long id, Long userId);

    List<Timetable> findByUserIdAndIsActive(Long userId, Boolean isActive);

    java.util.Optional<Timetable> findByShareTokenAndIsPublicTrue(String shareToken);
}
