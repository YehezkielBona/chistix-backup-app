# 🎟️ Chistix — Event Management & Ticketing Platform

Project ini menggunakan arsitektur terpisah antara **Frontend** dan **Backend** sesuai kontrak Tech Stack:

| Layer | Technology | Folder |
|---|---|---|
| **Frontend** | Next.js + TypeScript + Tailwind CSS | `frontend/` |
| **Backend** | Node.js + Express + TypeScript (`routes -> controllers -> services`) | `backend/` |
| **ORM & Database** | Prisma ORM + Neon PostgreSQL | `backend/prisma/` |
| **Image Hosting** | Cloudinary (Signed Upload via Express) | `backend/src/services/cloudinary.service.ts` |
| **Data Wilayah Indonesia** | API Emsifa (`EMSIFA_BASE_URL`) | `backend/src/services/region.service.ts` |

---

## 📂 Struktur Folder Project

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

---

## 🚀 Cara Menjalankan di Lokal (2 Terminal)

### 1. Jalankan Backend Express (Terminal 1)
```powershell
cd backend
Copy-Item .env-sample .env   # (jika belum ada .env, lalu isi nilainya)
npm install
npx prisma generate
npm run dev                  # Jalan di http://localhost:4000
```

### 2. Jalankan Frontend Next.js (Terminal 2)
```powershell
cd frontend
Copy-Item .env-sample .env.local
npm install
npm run dev                  # Jalan di http://localhost:3000
```

---

## 🌱 Seeding & Data Akun Dummy (`npm run db:seed`)

Untuk mengisi data awal (2 akun dummy, 3 event contoh, dan 2 kode voucher) ke database Neon PostgreSQL:
```powershell
cd backend
npm run db:seed
```

Data yang dibuat oleh seeder:
1. **Akun Organizer Dummy**
   - Email: `organizer@chistix.id`
   - Nama: `Soundwave Organizer`
   - Role: `ORGANIZER`
2. **Akun Customer Dummy**
   - Email: `customer@chistix.id`
   - Nama: `Budi Santoso`
   - Role: `CUSTOMER` (Points: `150.000`)
3. **Kode Voucher Contoh**
   - `EVT01` -> Diskon **10%** (Percentage)
   - `CHISTIX50K` -> Diskon **Rp 50.000** (Fixed)

---

## 🗺️ Panduan Integrasi API Wilayah Indonesia (Emsifa)

1. Emsifa adalah API publik gratis untuk mengambil daftar **34 Provinsi** dan **Kota/Kabupaten** di Indonesia tanpa memerlukan registrasi API Key.
2. Dokumentasi resmi: `https://www.emsifa.com/api-wilayah-indonesia/`
3. Masukkan URL dasarnya ke `backend/.env`:
   ```env
   EMSIFA_BASE_URL=https://www.emsifa.com/api-wilayah-indonesia/api
   ```
4. Endpoint di Backend Express kita (`backend/src/services/region.service.ts`):
   - `GET /api/regions/provinces` -> Mengambil seluruh provinsi Indonesia.
   - `GET /api/regions/cities/:provinceId` -> Mengambil seluruh kota/kabupaten berdasarkan ID provinsi.
5. Digunakan di:
   - Halaman **Create Event** & **Edit Event** (pilihan Provinsi & Kota otomatis berjenjang).
   - Komponen **SidebarPortal** pada halaman **Browse Event** (filter lokasi berdasarkan Provinsi Emsifa).

---

## ☁️ Panduan Integrasi Cloudinary (Image Hosting)

1. Buka [https://cloudinary.com](https://cloudinary.com) -> Login ke Dashboard.
2. Buka menu **Settings / API Keys**, lalu salin **Cloud Name**, **API Key**, dan **API Secret**.
3. Masukkan ketiganya ke dalam `backend/.env` (JANGAN pernah ditaruh di frontend):
   ```env
   CLOUDINARY_CLOUD_NAME=mzlrarfc
   CLOUDINARY_API_KEY=759957135735754
   CLOUDINARY_API_SECRET=isi_api_secret_disini
   CLOUDINARY_FOLDER=chistix
   ```
4. Saat Organizer memilih gambar Thumbnail atau Cover di halaman Create/Edit Event:
   - Frontend memanggil `POST /api/upload/signature` ke Express.
   - Express membuat tanda tangan SHA-1 (`cloudinary.service.ts`).
   - Browser mengunggah file langsung ke Cloudinary dan menyimpan `secure_url`-nya ke database Neon.
