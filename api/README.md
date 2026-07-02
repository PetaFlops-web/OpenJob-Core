# Open-Job API

Express 5 REST API for a job portal: jobseeker/recruiter auth, companies, jobs, applications, documents/CV, ATS scoring, interviews, notifications, bookmarks, skills, Redis cache, RabbitMQ events, and Docker runtime.

## Requirements

- Node.js 24+
- PostgreSQL 16
- Redis 7
- RabbitMQ 3.13
- ATS Flask service (`ATS_ML_API_URL`)

`docker-compose.yml` is not required in this repository. Run infrastructure however you prefer, then point `.env` to it.

## Quick Start

```bash
cp .env.example .env
npm install
npm run migrate:up
npm run start:dev
```

API defaults:

- API: `http://localhost:3000`
- Swagger: `http://localhost:3000/docs`
- Health: `http://localhost:3000/health`

## Environment

Use `.env.example` as the template.

Important values:

```env
PGHOST=localhost
PGPORT=5432
PGDATABASE=openjob_db
PGUSER=openjob
PGPASSWORD=openjob

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=openjob_redis_secret

RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USERNAME=guest
RABBITMQ_PASSWORD=guest
RABBITMQ_VHOST=/

ATS_ML_API_URL=http://localhost:5000
RUN_MIGRATIONS=auto
```

## Consumer

```text
../consumer/
```

Run it from this API project with:

```bash
npm run start:consumer
```

That script runs:

```bash
node ../consumer/index.js
```

Consumer keeps its own small shared utilities under:

```text
../consumer/shared/
```

## Seed Data

`npm run seed` fills a fresh database and upload folders with realistic demo data:

- 3 jobseekers
- 2 recruiters
- 6 categories
- 3 companies with logo files
- 6 jobs
- 3 PDF CV documents
- ATS analysis rows and application `ats_score`
- 6 applications
- 4 interviews
- 6 bookmarks
- 9 notifications
- 18 jobseeker skills

Login password for all seeded users:

```text
password123
```

Seeded accounts:

```text
Jobseeker: dimas.pratama@email.com
Jobseeker: siti.nurhaliza@email.com
Jobseeker: budi.santoso@email.com
Recruiter: rina.wijaya@email.com
Recruiter: ahmad.hidayat@email.com
```

Reset app-owned upload files before reseeding if needed:

```bash
rm -f src/profile/uploads/*.png src/profile/uploads/*.jpg \
      src/companies/uploads/*.png src/companies/uploads/*.jpg \
      src/documents/pdf/document-*.pdf
npm run seed
```

## Scripts

```bash
npm test               # Vitest test suite
npm run lint           # ESLint
npm run seed           # Seed demo data into PostgreSQL + upload folders
npm run migrate:up     # Run migrations
npm run migrate:down   # Roll back migrations
npm run start:dev      # Start API with nodemon
npm run start:consumer # Start external ../consumer worker
```

## Storage Paths

Runtime upload folders used by the API:

```text
src/profile/uploads
src/companies/uploads
src/documents/pdf
```

The root-level `documents/` folder is not used by the API.

## Main Endpoints

### Auth

| Method | Path | Description |
|---|---|---|
| `POST` | `/authentications` | Login |
| `PUT` | `/authentications` | Refresh token |
| `DELETE` | `/authentications` | Logout |
| `POST` | `/auth/mfa/setup` | Setup MFA |
| `POST` | `/auth/mfa/verify` | Verify MFA |
| `DELETE` | `/auth/mfa/disable` | Disable MFA |
| `GET` | `/auth/sessions` | List sessions |

### Users / Profile / Skills

| Method | Path | Description |
|---|---|---|
| `POST` | `/users` | Register user |
| `GET` | `/users/:id` | Get user by ID |
| `GET` | `/users/:id/skills` | Recruiter-only: view applicant skills |
| `GET` | `/profile` | Own profile |
| `PUT` | `/profile` | Update own profile |
| `POST` | `/profile/avatar` | Upload avatar |
| `GET` | `/skills` | Jobseeker own skills |
| `POST` | `/skills` | Add skill |
| `POST` | `/skills/bulk` | Add many skills |

### Companies / Jobs

| Method | Path | Description |
|---|---|---|
| `GET` | `/companies` | List companies |
| `POST` | `/companies` | Recruiter creates company |
| `PUT` | `/companies/:companyId` | Update company |
| `POST` | `/companies/:companyId/logo` | Upload logo |
| `GET` | `/jobs` | List jobs |
| `POST` | `/jobs` | Recruiter creates job |
| `POST` | `/jobs/search` | Search jobs |
| `POST` | `/jobs/:jobId/bookmark` | Jobseeker bookmark |
| `DELETE` | `/jobs/:jobId/bookmark` | Remove bookmark by job ID |

### Documents / ATS / Applications

| Method | Path | Description |
|---|---|---|
| `POST` | `/documents` | Upload PDF CV (`document` multipart field) |
| `GET` | `/documents` | List own documents |
| `GET` | `/documents/:documentId` | Owner-only PDF download |
| `DELETE` | `/documents/:documentId` | Owner-only delete |
| `POST` | `/ats/scan` | Score CV through ATS Flask |
| `GET` | `/ats/analyses` | Own ATS history |
| `POST` | `/applications` | Apply to job; optional `document_id` auto-saves `ats_score` |
| `GET` | `/applications/:applicationId` | Application detail with `created_at`, `document_id`, `ats_score` |
| `PATCH` | `/applications/:applicationId` | Recruiter-owner updates application status |
| `GET` | `/applications/:applicationId/document` | Applicant or company recruiter downloads attached CV |
| `GET` | `/profile/applications` | Own applications |
| `GET` | `/applications/job/:jobId` | Recruiter sees applicants by job |

### Interviews / Notifications

| Method | Path | Description |
|---|---|---|
| `POST` | `/interviews` | Recruiter schedules interview |
| `GET` | `/interviews/user` | Jobseeker own interviews |
| `GET` | `/profile/interviews/:interviewId` | Jobseeker interview detail |
| `PUT` | `/interviews/:id/complete` | Mark complete |
| `PUT` | `/interviews/:id/no-show` | Mark no-show |
| `GET` | `/notifications` | Notifications with pagination |
| `GET` | `/notifications/unread-count` | Unread count |
| `PUT` | `/notifications/read-all` | Mark all read |
| `GET` | `/notifications/preferences` | Preferences |
| `PUT` | `/notifications/preferences` | Update preferences |


## Verification

Current baseline:

```bash
npm test
# 20 files passed, 207 tests passed

npm run lint
# 0 errors, 0 warnings
```
