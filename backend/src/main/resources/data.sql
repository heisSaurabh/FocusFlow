-- ============================================================
-- Sample Seed Data for Timetable & Productivity Manager
-- ============================================================

-- Insert roles
INSERT INTO roles (name) VALUES ('ROLE_USER') ON CONFLICT DO NOTHING;
INSERT INTO roles (name) VALUES ('ROLE_ADMIN') ON CONFLICT DO NOTHING;

-- Insert sample users (passwords are BCrypt of 'password123')
INSERT INTO users (email, name, password, phone, bio, is_enabled, daily_work_hours_goal)
VALUES
  ('focus@admin.com',  'Admin User',    '$2a$12$h5PQK1M9Xxfo1FYYRo/c5.Dih6CPSULcvDjaF2zio6f5wpKZkQ8yW', '9999999999', 'System Administrator', TRUE, 8),
  ('alice@example.com',    'Alice Johnson', '$2a$12$LN/U.gRQLJmRxwUBFHk1TeKpq3jkL3QHtYFOFw9B3d1rZCciqOJOG', '9876543210', 'MCA Student at DU. Loves coding and productivity hacks.', TRUE, 6),
  ('bob@example.com',      'Bob Kumar',     '$2a$12$LN/U.gRQLJmRxwUBFHk1TeKpq3jkL3QHtYFOFw9B3d1rZCciqOJOG', '9123456780', 'Software developer. Night owl. Coffee enthusiast.', TRUE, 8)
ON CONFLICT DO NOTHING;

-- Assign roles (user id 1 = admin, 2 & 3 = users)
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE u.email = 'focus@admin.com' AND r.name IN ('ROLE_USER', 'ROLE_ADMIN')
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE u.email IN ('alice@example.com', 'bob@example.com') AND r.name = 'ROLE_USER'
ON CONFLICT DO NOTHING;

-- Insert system-level task categories (3NF normalization)
INSERT INTO task_categories (name, user_id)
VALUES
  ('STUDY',    NULL),
  ('WORK',     NULL),
  ('PERSONAL', NULL),
  ('HEALTH',   NULL),
  ('FINANCE',  NULL),
  ('OTHER',    NULL)
ON CONFLICT DO NOTHING;

-- Insert sample tasks for Alice (using category_id FK)
INSERT INTO tasks (user_id, title, description, priority, status, category_id, deadline, estimated_hours, ai_score)
SELECT u.id, 'Complete Data Structures Assignment', 'Binary trees + graph traversal problems', 'HIGH', 'IN_PROGRESS',
       (SELECT id FROM task_categories WHERE name = 'STUDY' AND user_id IS NULL),
       NOW() + INTERVAL '2 days', 3.0, 90.0
FROM users u WHERE u.email = 'alice@example.com';

INSERT INTO tasks (user_id, title, description, priority, status, category_id, deadline, estimated_hours, ai_score)
SELECT u.id, 'Prepare MCA Project Presentation', 'Slides + demo for Timetable Manager project', 'URGENT', 'TODO',
       (SELECT id FROM task_categories WHERE name = 'STUDY' AND user_id IS NULL),
       NOW() + INTERVAL '1 day', 4.0, 100.0
FROM users u WHERE u.email = 'alice@example.com';

INSERT INTO tasks (user_id, title, description, priority, status, category_id, deadline, estimated_hours, ai_score)
SELECT u.id, 'Spring Boot REST API Review', 'Review JWT auth and service layer', 'MEDIUM', 'TODO',
       (SELECT id FROM task_categories WHERE name = 'STUDY' AND user_id IS NULL),
       NOW() + INTERVAL '7 days', 2.0, 55.0
FROM users u WHERE u.email = 'alice@example.com';

INSERT INTO tasks (user_id, title, description, priority, status, category_id, estimated_hours, ai_score)
SELECT u.id, 'Morning Jog', '30 min cardio workout', 'LOW', 'COMPLETED',
       (SELECT id FROM task_categories WHERE name = 'HEALTH' AND user_id IS NULL),
       0.5, 25.0
FROM users u WHERE u.email = 'alice@example.com';

INSERT INTO tasks (user_id, title, description, priority, status, category_id, deadline, estimated_hours, ai_score)
SELECT u.id, 'Buy Groceries', 'Weekly vegetables and essentials', 'LOW', 'TODO',
       (SELECT id FROM task_categories WHERE name = 'PERSONAL' AND user_id IS NULL),
       NOW() + INTERVAL '3 days', 1.0, 27.0
FROM users u WHERE u.email = 'alice@example.com';

-- Sample timetable for Alice
INSERT INTO timetables (user_id, name, description, type, is_active)
SELECT u.id, 'MCA Semester 4 Timetable', 'Weekly schedule for MCA 4th semester', 'WEEKLY', TRUE
FROM users u WHERE u.email = 'alice@example.com';

-- Schedule entries
INSERT INTO schedule_entries (timetable_id, title, day_of_week, start_time, end_time, is_recurring)
SELECT t.id, 'Data Structures Lecture', 1, '09:00', '10:30', TRUE
FROM timetables t JOIN users u ON t.user_id = u.id WHERE u.email = 'alice@example.com' LIMIT 1;

INSERT INTO schedule_entries (timetable_id, title, day_of_week, start_time, end_time, is_recurring)
SELECT t.id, 'Database Management Lab', 3, '11:00', '13:00', TRUE
FROM timetables t JOIN users u ON t.user_id = u.id WHERE u.email = 'alice@example.com' LIMIT 1;

INSERT INTO schedule_entries (timetable_id, title, day_of_week, start_time, end_time, is_recurring)
SELECT t.id, 'Self Study - Algorithms', 2, '17:00', '19:00', TRUE
FROM timetables t JOIN users u ON t.user_id = u.id WHERE u.email = 'alice@example.com' LIMIT 1;

INSERT INTO schedule_entries (timetable_id, title, day_of_week, start_time, end_time, is_recurring)
SELECT t.id, 'Morning Exercise', 0, '06:30', '07:30', TRUE
FROM timetables t JOIN users u ON t.user_id = u.id WHERE u.email = 'alice@example.com' LIMIT 1;

-- Sample notifications
INSERT INTO notifications (user_id, type, message, is_read)
SELECT u.id, 'REMINDER', '⏰ Your task "Complete Data Structures Assignment" is due in 2 days!', FALSE
FROM users u WHERE u.email = 'alice@example.com';

INSERT INTO notifications (user_id, type, message, is_read)
SELECT u.id, 'AI_INSIGHT', '🤖 AI Tip: You have 2 high-priority tasks due this week. Start with the hardest one first!', FALSE
FROM users u WHERE u.email = 'alice@example.com';

INSERT INTO notifications (user_id, type, message, is_read)
SELECT u.id, 'SYSTEM', '🎉 Welcome to Timetable & Productivity Manager! Set up your first timetable to get started.', TRUE
FROM users u WHERE u.email = 'alice@example.com';
