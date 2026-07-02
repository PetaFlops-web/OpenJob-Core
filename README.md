# Open-Job

Modern job portal platform connecting job seekers with recruiters. Monorepo containing REST API, frontend, background consumer, and ML-powered ATS (Applicant Tracking System) scoring.

## Architecture

```
┌──────────┐     ┌──────────┐     ┌──────────────┐
│   UI     │────▶│   API    │────▶│  PostgreSQL   │
│ (Next.js)│     │(Express) │     │  Redis        │
└──────────┘     └────┬─────┘     │  RabbitMQ     │
                      │           └──────────────┘
                      │
                ┌─────┴─────┐
                │           │
          ┌─────▼───┐  ┌───▼──────┐
          │Consumer  │  │ ATS ML   │
          │(RabbitMQ)│  │ (Flask)  │
          └─────────┘  └──────────┘
```

| Service    | Stack                                | Port  |
|------------|--------------------------------------|-------|
| **api/**   | Express 5, Node.js, PostgreSQL, Redis, RabbitMQ | 3001  |
| **ui/**    | Next.js 16, React 19, Tailwind CSS 4 | 3000  |
| **consumer/** | Node.js, RabbitMQ, Nodemailer     | —     |
| **ats/**   | Flask, PyTorch, sentence-transformers | 5000  |

## Key Features

- **Authentication** — JWT (access + refresh tokens), MFA (TOTP), session management, Firebase social login
- **Role-based access** — Jobseeker and Recruiter roles with scoped endpoints
- **Job management** — CRUD, search, categories, bookmarks
- **Applications** — Apply to jobs with CV, status tracking, ATS score integration
- **ATS scoring** — ML model (MiniLM regressor) analyzes PDF CVs against job descriptions
- **Interviews** — Scheduling, availability, reminders via RabbitMQ consumer
- **Notifications** — Real-time via Socket.IO + Redis adapter, email via consumer
- **Documents** — PDF CV upload/download, per-user storage
- **Companies** — Profiles with logo uploads
- **Skills** — Jobseeker skill management, recruiter visibility
- **i18n** — Multi-language support (i18next)
- **API docs** — Swagger/OpenAPI 3.0 at `/docs`

## Quick Start

### Docker (recommended)

```bash
git clone https://github.com/PetaFlops-web/Open-Job.git
cd Open-Job

# Copy and edit environment variables
cp api/.env.example api/.env

docker compose up -d
```

Services will be available at:
- UI: http://localhost:3000
- API: http://localhost:3001
- Swagger: http://localhost:3001/docs
- RabbitMQ Management: http://localhost:15673 (guest/guest)
- ATS ML: http://localhost:5000

### Local Development

```bash
# API
cd api && cp .env.example .env && npm install
npm run migrate:up
npm run start:dev

# UI (separate terminal)
cd ui && npm install && npm run dev

# Consumer (separate terminal)
cd consumer && npm install && npm start
```

Requires Node.js 24+, PostgreSQL 16, Redis 7, and RabbitMQ 4 running locally.

### Seed Demo Data

```bash
cd api
npm run seed
```

Creates 5 users (3 jobseekers, 2 recruiters), 6 categories, 3 companies, 6 jobs, applications, interviews, bookmarks, and notifications. Password for all seeded accounts: `password123`.

| Role      | Email                         |
|-----------|-------------------------------|
| Jobseeker | dimas.pratama@email.com       |
| Jobseeker | siti.nurhaliza@email.com      |
| Jobseeker | budi.santoso@email.com        |
| Recruiter | rina.wijaya@email.com         |
| Recruiter | ahmad.hidayat@email.com       |

## Project Structure

```
Open-Job/
├── api/                 # Express REST API
│   ├── src/
│   │   ├── routes/      # Route definitions with JSDoc/Swagger annotations
│   │   ├── applications/
│   │   ├── jobs/
│   │   ├── companies/
│   │   ├── interviews/
│   │   ├── notifications/
│   │   ├── documents/
│   │   ├── skills/
│   │   ├── profile/
│   │   ├── users/
│   │   ├── authentications/
│   │   ├── security/    # MFA, sessions, Firebase
│   │   ├── ats/         # ATS integration
│   │   ├── middlewares/
│   │   ├── cache/       # Redis service
│   │   ├── ws/          # Socket.IO realtime
│   │   ├── export/      # RabbitMQ producer
│   │   └── i18n/
│   ├── migrations/      # node-pg-migrate
│   ├── scripts/         # seed.js
│   └── tests/           # Vitest test suite
├── ui/                  # Next.js frontend
│   └── src/
│       ├── app/         # App Router pages
│       ├── components/
│       ├── hooks/
│       ├── lib/
│       └── providers/
├── consumer/            # RabbitMQ background worker
│   ├── index.js         # Entry point
│   ├── Listener.js      # Queue consumer
│   ├── MailSender.js    # SMTP wrapper
│   ├── application.service.js
│   ├── interview-reminder.service.js
│   └── shared/          # rabbitmq, realtime, logger
├── ats/                 # ML-powered ATS scoring
│   ├── flaskApi/        # Flask API server
│   ├── Modelling/       # Training & prediction
│   ├── Preprocessing/   # Text cleaning
│   ├── notebooks/       # Jupyter experiments
│   └── dataset/
└── docker-compose.yml   # Full-stack orchestration
```

## Scripts

| Command                   | Description                     |
|---------------------------|---------------------------------|
| `docker compose up -d`    | Start all services              |
| `docker compose down`     | Stop all services               |
| `cd api && npm test`      | Run API test suite (Vitest)     |
| `cd api && npm run lint`  | Lint API (ESLint)               |
| `cd api && npm run seed`  | Seed demo data                  |
| `cd api && npm run migrate:up` | Run DB migrations        |
| `cd ui && npm run build`  | Build UI for production         |

## CI/CD

GitHub Actions pipeline (`.github/workflows/ci.yml`) runs on push to `main`/`develop`:

1. **API** — Lint & test
2. **UI** — Lint
3. **API Docker** — Build verification
4. **UI Docker** — Build verification

## Environment Variables

See [`api/.env.example`](api/.env.example) for the full list. Key sections:

| Group     | Variables                                                     |
|-----------|---------------------------------------------------------------|
| Database  | `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`     |
| Redis     | `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`                  |
| RabbitMQ  | `RABBITMQ_HOST`, `RABBITMQ_PORT`, `RABBITMQ_USERNAME/PASSWORD`|
| JWT       | `ACCESS_TOKEN_KEY`, `REFRESH_TOKEN_KEY`                       |
| SMTP      | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`           |
| ATS       | `ATS_ML_API_URL`, `ATS_ML_API_KEY`                           |
| Firebase  | `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` |

## License

ISC
