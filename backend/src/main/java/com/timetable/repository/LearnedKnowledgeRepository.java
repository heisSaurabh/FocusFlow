package com.timetable.repository;

import com.timetable.model.entity.LearnedKnowledge;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LearnedKnowledgeRepository extends JpaRepository<LearnedKnowledge, Long> {
    List<LearnedKnowledge> findByUserId(Long userId);
}
