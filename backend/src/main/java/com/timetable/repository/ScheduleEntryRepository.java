package com.timetable.repository;

import com.timetable.model.entity.ScheduleEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalTime;
import java.util.List;

@Repository
public interface ScheduleEntryRepository extends JpaRepository<ScheduleEntry, Long> {

    List<ScheduleEntry> findByTimetableId(Long timetableId);

    List<ScheduleEntry> findByTimetableIdAndDayOfWeek(Long timetableId, Integer dayOfWeek);

    /** Detect time conflicts for a given timetable day */
    @Query("SELECT e FROM ScheduleEntry e WHERE e.timetable.id = :timetableId " +
            "AND e.dayOfWeek = :day " +
            "AND e.id != :excludeId " +
            "AND (e.startTime < :endTime AND e.endTime > :startTime)")
    List<ScheduleEntry> findConflicts(@Param("timetableId") Long timetableId,
            @Param("day") Integer day,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime,
            @Param("excludeId") Long excludeId);
}
