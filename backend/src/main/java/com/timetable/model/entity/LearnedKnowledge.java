package com.timetable.model.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "learned_knowledge")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LearnedKnowledge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String userQuery;

    @Column(nullable = false)
    private String correctedIntent; // e.g. "BEAT_PROCRASTINATION" or "NLP_TASK"

    @Column
    private String correctedJson; // For NLP task corrections, stores the JSON fields they confirmed

    @CreationTimestamp
    private LocalDateTime learnedAt;

}
