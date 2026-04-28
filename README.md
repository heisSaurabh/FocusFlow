# ⚡ FocusFlow (Timetable & Productivity Manager)

Hey there! 👋 This is an open-source, full-stack productivity app I built because I was tired of task managers that lock basic metrics behind paywalls or require an internet connection to parse a simple task. FocusFlow is meant for students, indie hackers, and professionals who just want to get things done.

> **100% Free & Local** — No paid subscriptions, no cloud API keys required. All the "smart" features use a fast, built-in heuristic engine that runs entirely on your own machine.

---

## ✨ What's Inside?

| Feature | What it does |
|---|---|
| 🔐 **Secure Accounts** | Standard JWT-based auth (access + refresh tokens) |
| 📋 **Task Board** | Easy to use Kanban-style board with deadlines and priority |
| 📅 **Smart Timetable** | An interactive weekly view that warns you before you double-book yourself |
| 🍅 **Pomodoro Timer** | A clean, SVG-based circular timer to track your focus sessions |
| 🤖 **Offline Chatbot** | A rule-based productivity coach to bounce ideas off (totally local) |
| 📝 **NLP Parsing** | Type "Study for exams tomorrow at 5pm" and watch it magically schedule |
| ⚡ **Auto-Schedule** | Hit a button and let the engine slot your tasks into free gaps in your day |
| 📊 **Deep Analytics** | Track your wins with weekly charts, category breakdowns, and a unified Productivity Score |
| 🖨️ **PDF Reports** | Generate beautiful PDF summaries of your tasks locally—no cloud required |
| 🔔 **Reminders** | Background email notifications using Spring's scheduling tools |

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Java 17, Spring Boot 3.2, Spring Security, Spring Data JPA |
| **Database** | PostgreSQL 15 |
| **Auth** | JWT (JJWT 0.12), BCrypt |
| **Frontend** | React 18, Vite, Zustand, Recharts, Framer Motion |
| **HTTP Client** | Axios with automatic JWT refresh interceptor |
| **API Docs** | Springdoc OpenAPI 3 (Swagger UI) |
| **Containers** | Docker + Docker Compose + Nginx |

---

## 🚀 Quick Start

### Option A: Docker Compose (Recommended)

```bash
# 1. Clone the project
cd timetable-productivity-manager

# 2. Copy and edit environment variables
cp .env.example .env

# 3. Start all services
docker-compose up -d

# App will be available at:
# Frontend → http://localhost:3000
# Backend API → http://localhost:8083
# Swagger UI → http://localhost:8083/swagger-ui/index.html
```

### Option B: Local Development

**Prerequisites:** Java 17+, Maven 3.9+, Node 20+, PostgreSQL 15

**1. Database Setup:**
Create a PostgreSQL database named `timetable_db`.

**2. Environment Configuration:**
Copy `.env.example` to `.env` in the root directory and fill in your credentials:
```bash
cp .env.example .env
```

**3. Backend:**
```bash
cd backend
mvn spring-boot:run
# → http://localhost:8083
```

**4. Frontend:**
```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```


---

## 🗄️ Database Setup

```sql
CREATE DATABASE timetable_db;
CREATE USER timetable WITH PASSWORD 'YOUR_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE timetable_db TO timetable;
```

Run seed data (optional):
```bash
psql -U timetable -d timetable_db -f backend/src/main/resources/data.sql
```

**Demo credentials (configured locally):**
- Create your own user via the Register page on first launch.


---

## 📁 Project Structure

```
timetable-productivity-manager/
├── backend/                     # Spring Boot application
│   ├── src/main/java/com/timetable/
│   │   ├── controller/          # REST controllers (9 controllers)
│   │   ├── service/             # Business logic (9 services)
│   │   ├── repository/          # Spring Data JPA repositories
│   │   ├── model/entity/        # JPA entities
│   │   ├── model/dto/           # Request/Response DTOs
│   │   ├── security/            # JWT filter, config, UserDetailsService
│   │   ├── exception/           # Custom exceptions + GlobalExceptionHandler
│   │   └── config/              # OpenAPI config
│   └── src/main/resources/
│       ├── application.yml      # App configuration
│       ├── schema.sql           # PostgreSQL DDL
│       └── data.sql             # Seed data
├── frontend/                    # React + Vite application
│   ├── src/
│   │   ├── api/api.js           # Axios client + all API methods
│   │   ├── store/authStore.js   # Zustand auth state
│   │   ├── pages/               # 9 page components
│   │   └── components/          # Sidebar, reusable components
│   ├── nginx.conf               # Nginx config for production
│   └── Dockerfile               # Multi-stage build
├── docker-compose.yml           # Full stack orchestration
└── .env.example                 # Environment variables template
```

---

## 🔌 API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/auth/register` | POST | Register new user |
| `/api/auth/login` | POST | Login → JWT tokens |
| `/api/auth/refresh` | POST | Refresh access token |
| `/api/tasks` | GET/POST | List / create tasks |
| `/api/tasks/{id}` | PUT/DELETE | Update / delete task |
| `/api/timetables` | GET/POST | List / create timetables |
| `/api/timetables/{id}/entries` | GET/POST | Schedule entries |
| `/api/ai/chat` | POST | AI chatbot |
| `/api/ai/schedule` | GET | Smart schedule generator |
| `/api/ai/prioritize` | GET | AI task prioritization |
| `/api/ai/parse` | POST | NLP input parser |
| `/api/ai/insights` | GET | Productivity insights |
| `/api/analytics/score` | GET | Productivity score |
| `/api/analytics/weekly` | GET | Weekly completion data |
| `/api/pomodoro/start` | POST | Start Pomodoro session |
| `/api/notifications` | GET | Get notifications |

**Full interactive docs:** `http://localhost:8080/swagger-ui/index.html`

---

## 🤖 AI Features (100% Free)

All AI features run locally — **no external API needed**:

1. **Smart Scheduler** — Greedy algorithm assigns your pending tasks to optimal free time slots
2. **Task Prioritizer** — Weighted score = Priority × Urgency × Category bonus
3. **Productivity Insights** — Statistical analysis of completion rates, overdue tasks, workload balance
4. **NLP Input Parser** — Regex-based parser converts natural language to structured schedule data
5. **AI Chatbot** — Rule-based productivity coach with topic-matched Q&A

> **Optional:** Set `GEMINI_ENABLED=true` and `GEMINI_API_KEY=your-key` to upgrade AI responses to Google Gemini's free tier (1M tokens/month).

---

## 🧪 Running Tests

```bash
cd backend
mvn test
```

Tests cover: `TaskService` (CRUD, AI scoring, status transitions), `AuthService` (register, duplicate email).

---

## 📄 Environment Variables

| Variable | Default (in .env.example) | Description |
|---|---|---|
| `DB_USERNAME` | `timetable` | PostgreSQL username |
| `DB_PASSWORD` | `YOUR_PASSWORD` | PostgreSQL password |

| `JWT_SECRET` | `mySecretKey...` | Min 256-bit secret |
| `JWT_EXPIRATION` | `86400000` | Access token TTL (ms) |
| `JWT_REFRESH_EXPIRATION` | `604800000` | Refresh token TTL (ms) |
| `GEMINI_ENABLED` | `false` | Enable Gemini AI upgrade |
| `GEMINI_API_KEY` | *(empty)* | Google Gemini API key |


---

## 📝 License

MIT License — free to use, modify, and distribute.
