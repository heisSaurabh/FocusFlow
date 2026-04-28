package com.timetable.repository;

import com.timetable.model.entity.AiInsight;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AiInsightRepository extends JpaRepository<AiInsight, Long> {
    List<AiInsight> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<AiInsight> findByUserIdAndType(Long userId, AiInsight.InsightType type);

    List<AiInsight> findTop10ByUserIdOrderByCreatedAtDesc(Long userId);
}
