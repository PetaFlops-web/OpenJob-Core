# Open Job UI

Frontend aplikasi platform lowongan kerja — Next.js + TypeScript + Tailwind CSS.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 6
- **Styling**: Tailwind CSS 4
- **State**: React Context (Auth, Socket, Employer, Toast)
- **Real-time**: Socket.io Client
- **Icons**: Lucide React
- **Linting**: ESLint 9

## Getting Started

```bash
# Install dependencies
npm install

# Pastikan backend berjalan di localhost:3001
# dan .env.local sudah di-set:
echo "NEXT_PUBLIC_API_URL=http://localhost:3001" > .env.local

# Jalankan development server
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## Docker

```bash
# Build image
docker build -t open-job-ui .

# Run container
# NEXT_PUBLIC_API_URL di-set saat build (embedded di client bundle)
docker build --build-arg NEXT_PUBLIC_API_URL=http://backend:3001 -t open-job-ui .
docker run -p 3000:3000 open-job-ui
```

### Docker Compose
```yaml
services:
  ui:
    build:
      context: .
      args:
        NEXT_PUBLIC_API_URL: http://backend:3001
        BACKEND_URL: http://backend:3001
    ports:
      - "3000:3000"
    depends_on:
      - backend

  backend:
    image: open-job-backend  # ganti dengan image backend
    ports:
      - "3001:3001"
```

> **Note**: `NEXT_PUBLIC_API_URL` di-embed saat build time. Untuk mengubah backend URL, rebuild image dengan arg baru.

## Fitur

### Jobseeker
- Dashboard dengan statistik lamaran
- Profil & manajemen skills (via API)
- Lamaran — timeline status, tarik lamaran
- Bookmark lowongan
- Interview — detail modal, join meeting link, calendar view
- Upload dokumen & ATS score
- MFA login (TOTP)

### Employer (Recruiter)
- Dashboard statistik (lowongan, pelamar, interview)
- CRUD lowongan pekerjaan
- Manajemen pelamar — detail modal, CV download, update status
- Jadwalkan interview dengan calendar & availability
- Profil perusahaan
- API Keys management
- Real-time notifications (Socket.io)

### Umum
- Homepage — lowongan terbaru dari backend (real-time data)
- Pencarian lowongan dengan filter
- Detail perusahaan
- i18n (Indonesia & Inggris)
- Page transitions (CSS animation)
- Global API error toast handling
- Responsive design (mobile bottom nav + desktop sidebar)

## Struktur

```
src/
├── app/
│   ├── page.tsx                    # Homepage (data dari backend)
│   ├── login/                      # Autentikasi + MFA
│   ├── register/                   # Registrasi
│   ├── jobs/                       # Browse & detail lowongan
│   ├── companies/                  # Detail perusahaan
│   └── dashboard/
│       ├── employer/               # Dashboard recruiter
│       │   ├── page.tsx            # Overview stats
│       │   ├── jobs/               # CRUD lowongan
│       │   ├── applicants/         # Manajemen pelamar
│       │   ├── interviews/         # Jadwal interview
│       │   ├── company/            # Profil perusahaan
│       │   ├── api-keys/           # API Keys
│       │   ├── settings/           # Pengaturan
│       │   └── components/         # Modal pelamar & interview
│       └── seeker/                 # Dashboard jobseeker
│           ├── page.tsx            # Overview
│           ├── profile/            # Profil & skills
│           ├── applications/       # Lamaran saya
│           ├── bookmarks/          # Tersimpan
│           ├── interviews/         # Jadwal interview
│           └── settings/           # Pengaturan + MFA
├── components/
│   ├── cards/                      # JobCard, InterviewCard, ApplicationCard, CompanyCard
│   ├── modals/                     # Modal (reusable)
│   ├── ui/                         # Badge, Button, Skeleton, EmptyState, FormFields, CompanyLogo
│   ├── layout/                     # Navbar, Footer, AppShell, PageTransition
│   ├── dashboard/                  # Dashboard-specific components
│   ├── filters/                    # Filter components
│   └── forms/                      # Form components
├── hooks/
│   ├── use-i18n.ts                 # Translasi (t() function)
│   ├── use-modal-animation.ts      # Animasi modal mount/unmount
│   └── use-in-view.ts              # Intersection Observer
├── i18n/
│   └── locales/
│       ├── id.json                 # Bahasa Indonesia
│       └── en.json                 # English
├── lib/
│   ├── api.ts                      # API clients (jobs, companies, applications, interviews, etc)
│   ├── api-client.ts               # HTTP client + global error listener
│   ├── utils.ts                    # Utilities (resolveLogoUrl, formatDate, etc)
│   └── resolve-names.ts            # Resolve user/job names from IDs
├── providers/
│   ├── auth-provider.tsx           # Autentikasi context
│   ├── socket-provider.tsx         # Socket.io context
│   ├── employer-provider.tsx       # Employer context
│   └── toast-provider.tsx          # Toast notifications + API error listener
└── types/
    └── index.ts                    # TypeScript interfaces
```

## Environment

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:3001` |

## Backend

Backend harus berjalan di `localhost:3001` sebelum menjalankan frontend. Lihat dokumentasi backend untuk API endpoints.
