package com.timetable;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Main entry point for the Timetable & Productivity Manager application.
 * A full-stack SaaS platform for students and professionals.
 *
 * @author Timetable Team
 * @version 1.0.0
 */
@SpringBootApplication
@EnableScheduling
@EnableAsync
public class TimetableApplication {

    public static void main(String[] args) {
        SpringApplication.run(TimetableApplication.class, args);
    }
}
