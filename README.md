# Chistix — Event Management & Ticketing Platform

Project ini menggunakan arsitektur terpisah antara **Frontend** dan **Backend** sesuai kontrak Tech Stack:

| Layer | Technology | Folder |
|---|---|---|
| **Frontend** | Next.js + TypeScript + Tailwind CSS | `frontend/` |
| **Backend** | Node.js + Express + TypeScript (`routes -> controllers -> services`) | `backend/` |
| **ORM & Database** | Prisma ORM + Neon PostgreSQL | `backend/prisma/` |
| **Image Hosting** | Cloudinary (Signed Upload via Express) | `backend/src/services/cloudinary.service.ts` |
| **Data Wilayah Indonesia** | API Emsifa (`EMSIFA_BASE_URL`) | `backend/src/services/region.service.ts` |

---

## Struktur Folder Project

```text
Chistix/
├─ backend/                          # Server Express + TypeScript (Port 4000)
│  ├─ api/index.ts                   # Entrypoint Serverless untuk deploy Vercel
│  ├─ prisma/
│  │  ├─ schema.prisma               # Schema PostgreSQL (Neon DB)
│  │  └─ seed.ts                     # Seeder akun dummy, event, dan voucher
│  ├─ src/
│  │  ├─ server.ts                   # Titik masuk utama aplikasi Express
│  │  ├─ config/env.ts               # Konfigurasi pembacaan .env
│  │  ├─ lib/                        # Prisma client & helper response (sendResult)
│  │  ├─ middlewares/                # Validasi Zod, proteksi Role, & Global Error Handler
│  │  ├─ services/                   # Logika bisnis & query Prisma (event, voucher, region, cloudinary)
│  │  ├─ controllers/                # Pengendali request & validasi input
│  │  └─ routes/                     # Definisi endpoint Express Router
│  └─ .env-sample                    # Template variabel environment backend
│
└─ frontend/                         # Aplikasi Next.js UI (Port 3000)
   ├─ src/
   │  ├─ app/                        # Halaman UI (TANPA folder app/api)
   │  ├─ components/                 # Komponen UI
   │  └─ lib/                        # Auth client, Cloudinary uploader, validasi form
   ├─ next.config.ts                 # Proxy rewrites /api/* -> Backend Express (:4000)
   └─ .env-sample                    # Template variabel environment frontend
```


