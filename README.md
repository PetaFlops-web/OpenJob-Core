# Open-Job

Platform portal kerja modern yang menghubungkan pencari kerja dengan perusahaan. Monorepo berisi REST API, frontend, consumer background, dan scoring ATS (Applicant Tracking System) berbasis ML.

## Arsitektur

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

## Fitur Utama

- **Autentikasi** — JWT (access + refresh token), MFA (TOTP), manajemen sesi, login sosial Firebase
- **Akses berbasis peran** — Peran Pencari Kerja dan Rekruter dengan endpoint terbatas
- **Manajemen lowongan** — CRUD, pencarian, kategori, bookmark
- **Lamaran** — Melamar pekerjaan dengan CV, pelacakan status, integrasi skor ATS
- **Scoring ATS** — Model ML (MiniLM regressor) menganalisis CV PDF terhadap deskripsi pekerjaan
- **Wawancara** — Penjadwalan, ketersediaan, pengingat via consumer RabbitMQ
- **Notifikasi** — Realtime via Socket.IO + adapter Redis, email via consumer
- **Dokumen** — Upload/download CV PDF, penyimpanan per-pengguna
- **Perusahaan** — Profil dengan upload logo
- **Keahlian** — Manajemen keahlian pencari kerja, visibilitas untuk rekruter
- **i18n** — Dukungan multi-bahasa (i18next)
- **Dokumentasi API** — Swagger/OpenAPI 3.0 di `/docs`

## Mulai Cepat

### Docker (disarankan)

```bash
git clone https://github.com/PetaFlops-web/Open-Job.git
cd Open-Job

# Salin dan edit variabel lingkungan
cp api/.env.example api/.env

docker compose up -d
```

Layanan akan tersedia di:
- UI: http://localhost:3000
- API: http://localhost:3001
- Swagger: http://localhost:3001/docs
- RabbitMQ Management: http://localhost:15673 (guest/guest)
- ATS ML: http://localhost:5000

### Pengembangan Lokal

```bash
# API
cd api && cp .env.example .env && npm install
npm run migrate:up
npm run start:dev

# UI (terminal terpisah)
cd ui && npm install && npm run dev

# Consumer (terminal terpisah)
cd consumer && npm install && npm start
```

Memerlukan Node.js 24+, PostgreSQL 16, Redis 7, dan RabbitMQ 4 yang berjalan secara lokal.

### Seed Data Demo

```bash
cd api
npm run seed
```

Membuat 5 pengguna (3 pencari kerja, 2 rekruter), 6 kategori, 3 perusahaan, 6 lowongan, lamaran, wawancara, bookmark, dan notifikasi. Kata sandi untuk semua akun demo: `password123`.

| Peran        | Email                         |
|--------------|-------------------------------|
| Pencari Kerja | dimas.pratama@email.com       |
| Pencari Kerja | siti.nurhaliza@email.com      |
| Pencari Kerja | budi.santoso@email.com        |
| Rekruter     | rina.wijaya@email.com         |
| Rekruter     | ahmad.hidayat@email.com       |

## Struktur Proyek

```
Open-Job/
├── api/                 # REST API Express
│   ├── src/
│   │   ├── routes/      # Definisi route dengan anotasi JSDoc/Swagger
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
│   │   ├── security/    # MFA, sesi, Firebase
│   │   ├── ats/         # Integrasi ATS
│   │   ├── middlewares/
│   │   ├── cache/       # Layanan Redis
│   │   ├── ws/          # Realtime Socket.IO
│   │   ├── export/      # Producer RabbitMQ
│   │   └── i18n/
│   ├── migrations/      # node-pg-migrate
│   ├── scripts/         # seed.js
│   └── tests/           # Suite test Vitest
├── ui/                  # Frontend Next.js
│   └── src/
│       ├── app/         # Halaman App Router
│       ├── components/
│       ├── hooks/
│       ├── lib/
│       └── providers/
├── consumer/            # Worker background RabbitMQ
│   ├── index.js         # Titik masuk
│   ├── Listener.js      # Konsumer antrean
│   ├── MailSender.js    # Wrapper SMTP
│   ├── application.service.js
│   ├── interview-reminder.service.js
│   └── shared/          # rabbitmq, realtime, logger
├── ats/                 # Scoring ATS berbasis ML
│   ├── flaskApi/        # Server API Flask
│   ├── Modelling/       # Pelatihan & prediksi
│   ├── Preprocessing/   # Pembersihan teks
│   ├── notebooks/       # Eksperimen Jupyter
│   └── dataset/
└── docker-compose.yml   # Orkestrasi full-stack
```

## Perintah

| Perintah                      | Deskripsi                          |
|-------------------------------|------------------------------------|
| `docker compose up -d`        | Jalankan semua layanan             |
| `docker compose down`         | Hentikan semua layanan             |
| `cd api && npm test`          | Jalankan suite test API (Vitest)   |
| `cd api && npm run lint`      | Lint API (ESLint)                  |
| `cd api && npm run seed`      | Seed data demo                     |
| `cd api && npm run migrate:up`| Jalankan migrasi DB                |
| `cd ui && npm run build`      | Build UI untuk produksi            |

## CI/CD

Pipeline GitHub Actions (`.github/workflows/ci.yml`) berjalan saat push ke `main`/`develop`:

1. **API** — Lint & test
2. **UI** — Lint
3. **API Docker** — Verifikasi build
4. **UI Docker** — Verifikasi build

## Variabel Lingkungan

Lihat [`api/.env.example`](api/.env.example) untuk daftar lengkap. Bagian utama:

| Grup      | Variabel                                                      |
|-----------|---------------------------------------------------------------|
| Database  | `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`     |
| Redis     | `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`                  |
| RabbitMQ  | `RABBITMQ_HOST`, `RABBITMQ_PORT`, `RABBITMQ_USERNAME/PASSWORD`|
| JWT       | `ACCESS_TOKEN_KEY`, `REFRESH_TOKEN_KEY`                       |
| SMTP      | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`           |
| ATS       | `ATS_ML_API_URL`, `ATS_ML_API_KEY`                           |
| Firebase  | `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` |

## Lisensi

ISC
