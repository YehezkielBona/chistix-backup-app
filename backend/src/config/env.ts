// ============================================================
// Membaca variabel dari file .env di SATU tempat.
// Keuntungan: kalau ada env yang lupa diisi, kita tahu dari sini,
// dan file lain cukup import { env } from "../config/env.js".
// ============================================================

// Ambil env wajib. Kalau kosong -> lempar error yang jelas saat server start.
function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variabel env "${name}" belum diisi. Cek file backend/.env`);
  }
  return value;
}

export const env = {
  PORT: Number(process.env.PORT) || 4000,
  NODE_ENV: process.env.NODE_ENV ?? "development",

  // Alamat frontend: dipakai untuk CORS & Better Auth (trustedOrigins)
  FRONTEND_URL: process.env.FRONTEND_URL ?? "http://localhost:3000",

  DATABASE_URL: required("DATABASE_URL"),

  // Cloudinary (opsional saat start; dicek lagi saat dipakai)
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME ?? "",
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY ?? "",
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ?? "",
  CLOUDINARY_FOLDER: process.env.CLOUDINARY_FOLDER ?? "chistix",

  // Emsifa: API data wilayah Indonesia (publik, tanpa API key)
  EMSIFA_BASE_URL:
    process.env.EMSIFA_BASE_URL ?? "https://www.emsifa.com/api-wilayah-indonesia/api",
};
