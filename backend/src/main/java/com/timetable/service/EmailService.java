package com.timetable.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

/**
 * Email service using Spring Mail (JavaMailSender).
 * Emails are sent asynchronously via @Async to avoid blocking API threads.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:noreply@focusflow.app}")
    private String fromAddress;

    /**
     * Sends an HTML email asynchronously.
     *
     * @param to      recipient address
     * @param subject email subject
     * @param htmlBody HTML content of the email body
     */
    @Async
    public void sendHtmlEmail(String to, String subject, String htmlBody) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromAddress, "FocusFlow");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            mailSender.send(message);
            log.info("Email sent to {} | Subject: {}", to, subject);
        } catch (MessagingException | java.io.UnsupportedEncodingException e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
        }
    }

    // ─── Pre-built email templates ─────────────────────────────────────────

    /**
     * Build a task deadline reminder email body.
     */
    public String buildDeadlineEmailBody(String userName, String taskTitle, String deadline) {
        return """
                <!DOCTYPE html>
                <html lang="en">
                <head><meta charset="UTF-8"><title>Task Reminder</title></head>
                <body style="margin:0;padding:0;background:#0f0f1a;font-family:'Segoe UI',Arial,sans-serif;">
                  <div style="max-width:520px;margin:40px auto;background:#1a1a2e;border-radius:16px;overflow:hidden;border:1px solid rgba(99,102,241,0.25);">
                    <div style="background:linear-gradient(135deg,#6366f1 0%,#0ea5e9 100%);padding:32px 28px 20px;">
                      <h1 style="margin:0;color:#fff;font-size:1.5rem;font-weight:800;">⏰ Task Deadline Reminder</h1>
                      <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:0.9rem;">FocusFlow Productivity Manager</p>
                    </div>
                    <div style="padding:28px;">
                      <p style="color:#e2e8f0;font-size:0.95rem;margin-top:0;">Hi <strong style="color:#a5b4fc;">%s</strong>,</p>
                      <p style="color:#cbd5e1;font-size:0.88rem;line-height:1.6;">
                        This is a reminder that your task is approaching its deadline. Don't let it slip through!
                      </p>
                      <div style="background:rgba(99,102,241,0.1);border:1px solid rgba(99,102,241,0.25);border-radius:12px;padding:20px;margin:20px 0;">
                        <div style="font-size:0.75rem;color:#94a3b8;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px;">Task</div>
                        <div style="font-size:1.05rem;font-weight:700;color:#f1f5f9;">%s</div>
                        <div style="margin-top:10px;font-size:0.75rem;color:#94a3b8;text-transform:uppercase;letter-spacing:0.1em;">Deadline</div>
                        <div style="font-size:0.95rem;color:#f87171;font-weight:600;">%s</div>
                      </div>
                      <p style="color:#94a3b8;font-size:0.8rem;margin-bottom:0;">
                        Log in to FocusFlow to update your task status and keep your productivity score high!
                      </p>
                    </div>
                    <div style="border-top:1px solid rgba(99,102,241,0.15);padding:16px 28px;text-align:center;">
                      <p style="margin:0;font-size:0.75rem;color:#64748b;">
                        You received this because you have an active account on FocusFlow.<br>
                        This is an automated notification.
                      </p>
                    </div>
                  </div>
                </body>
                </html>
                """.formatted(userName, taskTitle, deadline);
    }

    /**
     * Build an analytics session report email body.
     */
    public String buildSessionReportEmailBody(String userName, int productivityScore, long tasksCompleted,
                                               long pomodoroSessions, String completionRate, String badge) {
        return """
                <!DOCTYPE html>
                <html lang="en">
                <head><meta charset="UTF-8"><title>Your Productivity Report</title></head>
                <body style="margin:0;padding:0;background:#0f0f1a;font-family:'Segoe UI',Arial,sans-serif;">
                  <div style="max-width:520px;margin:40px auto;background:#1a1a2e;border-radius:16px;overflow:hidden;border:1px solid rgba(99,102,241,0.25);">
                    <div style="background:linear-gradient(135deg,#6366f1 0%,#22c55e 100%);padding:32px 28px 20px;">
                      <h1 style="margin:0;color:#fff;font-size:1.5rem;font-weight:800;">📊 Your Productivity Report</h1>
                      <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:0.9rem;">FocusFlow — Last 7 Days Summary</p>
                    </div>
                    <div style="padding:28px;">
                      <p style="color:#e2e8f0;font-size:0.95rem;margin-top:0;">Hi <strong style="color:#a5b4fc;">%s</strong>,</p>
                      <p style="color:#cbd5e1;font-size:0.88rem;line-height:1.6;">Here's how you performed over the past 7 days:</p>
                      <div style="display:grid;gap:12px;margin:20px 0;">
                        <div style="background:rgba(99,102,241,0.1);border:1px solid rgba(99,102,241,0.25);border-radius:12px;padding:18px;display:flex;justify-content:space-between;align-items:center;">
                          <div>
                            <div style="font-size:0.75rem;color:#94a3b8;text-transform:uppercase;letter-spacing:0.1em;">Productivity Score</div>
                            <div style="font-size:2rem;font-weight:800;color:#a5b4fc;margin-top:4px;">%d<span style="font-size:1rem;color:#64748b;">/100</span></div>
                          </div>
                          <div style="font-size:1.5rem;">%s</div>
                        </div>
                        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;">
                          <div style="background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.2);border-radius:10px;padding:14px;text-align:center;">
                            <div style="font-size:1.4rem;font-weight:800;color:#4ade80;">%d</div>
                            <div style="font-size:0.72rem;color:#94a3b8;margin-top:4px;">Tasks Done</div>
                          </div>
                          <div style="background:rgba(14,165,233,0.08);border:1px solid rgba(14,165,233,0.2);border-radius:10px;padding:14px;text-align:center;">
                            <div style="font-size:1.4rem;font-weight:800;color:#38bdf8;">%d</div>
                            <div style="font-size:0.72rem;color:#94a3b8;margin-top:4px;">Pomodoros</div>
                          </div>
                          <div style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.2);border-radius:10px;padding:14px;text-align:center;">
                            <div style="font-size:1.4rem;font-weight:800;color:#fbbf24;">%s</div>
                            <div style="font-size:0.72rem;color:#94a3b8;margin-top:4px;">Completion</div>
                          </div>
                        </div>
                      </div>
                      <p style="color:#94a3b8;font-size:0.8rem;margin-bottom:0;">
                        Keep up the great work! Log in to FocusFlow to see your full analytics dashboard.
                      </p>
                    </div>
                    <div style="border-top:1px solid rgba(99,102,241,0.15);padding:16px 28px;text-align:center;">
                      <p style="margin:0;font-size:0.75rem;color:#64748b;">
                        You received this because you have an active account on FocusFlow.<br>
                        This is an automated weekly report.
                      </p>
                    </div>
                  </div>
                </body>
                </html>
                """.formatted(userName, productivityScore, badge, tasksCompleted, pomodoroSessions, completionRate);
    }
}
