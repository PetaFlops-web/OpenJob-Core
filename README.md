# Open-Job

A modern job portal platform that connects job seekers with companies. This monorepo includes a REST API, frontend application, background consumer, and an ML-based ATS (Applicant Tracking System) scoring service.

## Architecture

```text
┌──────────┐     ┌──────────┐     ┌──────────────┐
│   UI     │────▶│   API    │────▶│  PostgreSQL  │
│ (Next.js)│     │(Express) │     │  Redis       │
└──────────┘     └────┬─────┘     │  RabbitMQ    │
                      │           └──────────────┘
                      │
                ┌─────┴─────┐
                │           │
          ┌─────▼────┐  ┌───▼──────┐
          │ Consumer │  │  ATS ML  │
          │(RabbitMQ)│  │ (Flask)  │
          └──────────┘  └──────────┘
```

| Service | Stack | Port |
|---|---|---:|
| **api/** | Express 5, Node.js, PostgreSQL, Redis, RabbitMQ | 3001 |
| **ui/** | Next.js 16, React 19, Tailwind CSS 4 | 3000 |
| **consumer/** | Node.js, RabbitMQ, Nodemailer | — |
| **ats/** | Flask, PyTorch, sentence-transformers | 5000 |

## Key Features

- **Authentication** — JWT access and refresh tokens, TOTP-based MFA, session management, and Firebase social login
- **Role-based access control** — Separate permissions and restricted endpoints for job seekers and recruiters
- **Job management** — Job CRUD operations, search, categories, and bookmarks
- **Applications** — Submit job applications with CVs, track application status, and integrate ATS scores
- **ATS scoring** — An ML model based on a MiniLM regressor analyzes PDF CVs against job descriptions
- **Interviews** — Interview scheduling, availability management, and reminders through a RabbitMQ consumer
- **Notifications** — Real-time notifications using Socket.IO with a Redis adapter, plus email delivery through the consumer
- **Documents** — Upload and download PDF CVs with per-user storage
- **Companies** — Company profiles with logo uploads
- **Skills** — Job seeker skill management with recruiter visibility
- **Internationalization** — Multi-language support using i18next
- **API documentation** — Swagger

## Quick Start

### Docker (Recommended)

```bash
git clone https://github.com/PetaFlops-web/OpenJob-Core.git
cd Open-Job

# Copy and configure the environment variables
cp api/.env.example api/.env

docker compose up -d
```

The services will be available at:

- UI: http://localhost:3000
- API: http://localhost:3001
- Swagger: http://localhost:3001/docs
- RabbitMQ Management: http://localhost:15673 (`guest` / `guest`)
- ATS ML: http://localhost:5000

### Local Development

```bash
# API
cd api && cp .env.example .env && npm install
npm run migrate:up
npm run start:dev

# UI (in a separate terminal)
cd ui && npm install && npm run dev

# Consumer (in a separate terminal)
cd consumer && npm install && npm start
```

Local development requires Node.js 24+, PostgreSQL 16, Redis 7, and RabbitMQ 4.

### Demo Seed Data

```bash
cd api
npm run seed
```

This command creates five users (three job seekers and two recruiters), six categories, three companies, six job listings, applications, interviews, bookmarks, and notifications.

The password for all demo accounts is:

```text
password123
```

| Role | Email |
|---|---|
| Job Seeker | `dimas.pratama@email.com` |
| Job Seeker | `siti.nurhaliza@email.com` |
| Job Seeker | `budi.santoso@email.com` |
| Recruiter | `rina.wijaya@email.com` |
| Recruiter | `ahmad.hidayat@email.com` |

## Project Structure

```text
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
│   │   ├── security/    # MFA, sessions, and Firebase
│   │   ├── ats/         # ATS integration
│   │   ├── middlewares/
│   │   ├── cache/       # Redis services
│   │   ├── ws/          # Real-time Socket.IO
│   │   ├── export/      # RabbitMQ producer
│   │   └── i18n/
│   ├── migrations/      # node-pg-migrate migrations
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
│   └── shared/          # RabbitMQ, real-time, and logging utilities
├── ats/                 # ML-based ATS scoring service
│   ├── flaskApi/        # Flask API server
│   ├── Modelling/       # Model training and prediction
│   ├── Preprocessing/   # Text preprocessing
│   ├── notebooks/       # Jupyter experiments
│   └── dataset/
└── docker-compose.yml   # Full-stack orchestration
```

## Commands

| Command | Description |
|---|---|
| `docker compose up -d` | Start all services |
| `docker compose down` | Stop all services |
| `cd api && npm test` | Run the API test suite with Vitest |
| `cd api && npm run lint` | Lint the API with ESLint |
| `cd api && npm run seed` | Seed the database with demo data |
| `cd api && npm run migrate:up` | Run database migrations |
| `cd ui && npm run build` | Build the UI for production |

## CI/CD

The GitHub Actions pipeline in `.github/workflows/ci.yml` runs on pushes to the `main` and `develop` branches:

1. **API** — Run linting and tests
2. **UI** — Run linting
3. **API Docker** — Verify the API Docker image build
4. **UI Docker** — Verify the UI Docker image build

## Environment Variables

See [`api/.env.example`](api/.env.example) for the complete list of environment variables.

The main groups are:

| Group | Variables |
|---|---|
| Database | `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD` |
| Redis | `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` |
| RabbitMQ | `RABBITMQ_HOST`, `RABBITMQ_PORT`, `RABBITMQ_USERNAME`, `RABBITMQ_PASSWORD` |
| JWT | `ACCESS_TOKEN_KEY`, `REFRESH_TOKEN_KEY` |
| SMTP | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` |
| ATS | `ATS_ML_API_URL`, `ATS_ML_API_KEY` |
| Firebase | `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` |
