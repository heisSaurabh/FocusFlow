-- ============================================================
-- Timetable & Productivity Manager - Database Schema
-- PostgreSQL 15
-- ============================================================

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
    id   BIGSERIAL PRIMARY KEY,
    name VARCHAR(20) NOT NULL UNIQUE
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id                     BIGSERIAL PRIMARY KEY,
    email                  VARCHAR(100) NOT NULL UNIQUE,
    name                   VARCHAR(100) NOT NULL,
    password               VARCHAR(255) NOT NULL,
    phone                  VARCHAR(20),
    bio                    TEXT,
    avatar_url             VARCHAR(500),
    is_enabled             BOOLEAN NOT NULL DEFAULT TRUE,
    daily_work_hours_goal  INTEGER DEFAULT 8,
    created_at             TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at             TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_email ON users(email);

-- User-Role junction table
CREATE TABLE IF NOT EXISTS user_roles (
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id                 BIGSERIAL PRIMARY KEY,
    user_id            BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title              VARCHAR(200) NOT NULL,
    description        TEXT,
    priority           VARCHAR(10)  NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('LOW','MEDIUM','HIGH','URGENT')),
    status             VARCHAR(15)  NOT NULL DEFAULT 'TODO'   CHECK (status IN ('TODO','IN_PROGRESS','COMPLETED','CANCELLED')),
    category           VARCHAR(10)  NOT NULL DEFAULT 'PERSONAL' CHECK (category IN ('STUDY','WORK','PERSONAL','HEALTH','FINANCE','OTHER')),
    deadline           TIMESTAMP,
    reminder_at        TIMESTAMP,
    estimated_hours    DECIMAL(5,2) DEFAULT 1.0,
    actual_hours       DECIMAL(5,2) DEFAULT 0.0,
    color              VARCHAR(10)  DEFAULT '#6366f1',
    is_recurring       BOOLEAN      DEFAULT FALSE,
    recurring_pattern  VARCHAR(20),
    ai_score           DECIMAL(5,2),
    created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at       TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_task_user_id  ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_task_status   ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_task_deadline ON tasks(deadline);
CREATE INDEX IF NOT EXISTS idx_task_priority ON tasks(priority);

-- Timetables table
CREATE TABLE IF NOT EXISTS timetables (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        VARCHAR(100) NOT NULL,
    description TEXT,
    type        VARCHAR(10)  NOT NULL DEFAULT 'WEEKLY' CHECK (type IN ('DAILY','WEEKLY')),
    is_active   BOOLEAN DEFAULT TRUE,
    is_shared   BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_timetable_user_id ON timetables(user_id);

-- Schedule entries table
CREATE TABLE IF NOT EXISTS schedule_entries (
    id              BIGSERIAL PRIMARY KEY,
    timetable_id    BIGINT NOT NULL REFERENCES timetables(id) ON DELETE CASCADE,
    task_id         BIGINT REFERENCES tasks(id) ON DELETE SET NULL,
    title           VARCHAR(150) NOT NULL,
    description     TEXT,
    day_of_week     INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time      TIME NOT NULL,
    end_time        TIME NOT NULL,
    color           VARCHAR(10) DEFAULT '#6366f1',
    is_recurring    BOOLEAN DEFAULT FALSE,
    is_ai_generated BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS idx_entry_timetable_id ON schedule_entries(timetable_id);
CREATE INDEX IF NOT EXISTS idx_entry_day_of_week  ON schedule_entries(day_of_week);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id           BIGSERIAL PRIMARY KEY,
    user_id      BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type         VARCHAR(20) NOT NULL DEFAULT 'REMINDER'
                 CHECK (type IN ('DEADLINE','REMINDER','AI_INSIGHT','SYSTEM','COLLABORATION')),
    message      VARCHAR(300) NOT NULL,
    is_read      BOOLEAN DEFAULT FALSE,
    triggered_at TIMESTAMP,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notification_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_is_read ON notifications(is_read);

-- AI Insights table
CREATE TABLE IF NOT EXISTS ai_insights (
    id         BIGSERIAL PRIMARY KEY,
    user_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type       VARCHAR(25) NOT NULL
               CHECK (type IN ('SCHEDULE_SUGGESTION','TASK_PRIORITIZATION','PRODUCTIVITY_TIP','NLP_PARSE','CHATBOT_RESPONSE')),
    content    TEXT NOT NULL,
    user_query TEXT,
    engine     VARCHAR(15) DEFAULT 'RULE_BASED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_insight_user_id ON ai_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_insight_type    ON ai_insights(type);

-- Pomodoro sessions table
CREATE TABLE IF NOT EXISTS pomodoro_sessions (
    id               BIGSERIAL PRIMARY KEY,
    user_id          BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    task_id          BIGINT REFERENCES tasks(id) ON DELETE SET NULL,
    session_type     VARCHAR(12) NOT NULL DEFAULT 'WORK'
                     CHECK (session_type IN ('WORK','SHORT_BREAK','LONG_BREAK')),
    duration_minutes INTEGER NOT NULL DEFAULT 25,
    started_at       TIMESTAMP,
    completed_at     TIMESTAMP,
    is_completed     BOOLEAN DEFAULT FALSE,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pomodoro_user_id    ON pomodoro_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_pomodoro_started_at ON pomodoro_sessions(started_at);
