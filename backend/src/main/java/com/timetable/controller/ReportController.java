package com.timetable.controller;

import com.timetable.model.dto.TaskResponse;
import com.timetable.model.entity.User;
import com.timetable.service.PdfReportService;
import com.timetable.service.TaskService;
import com.timetable.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@Tag(name = "Reports", description = "Endpoints for generating exportable PDF reports")
@SecurityRequirement(name = "bearerAuth")
public class ReportController {

    private final PdfReportService pdfReportService;
    private final TaskService taskService;
    private final UserService userService;

    @GetMapping("/tasks/pdf")
    @Operation(summary = "Download a PDF report of all tasks")
    public ResponseEntity<byte[]> downloadTasksReport(@AuthenticationPrincipal UserDetails ud) {
        User user = userService.getUserByEmail(ud.getUsername());
        List<TaskResponse> tasks = taskService.getUserTasks(user.getId(), null);

        byte[] pdfBytes = pdfReportService.generateTasksReport(user, tasks);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", "FocusFlow_Task_Report.pdf");

        return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
    }
}
