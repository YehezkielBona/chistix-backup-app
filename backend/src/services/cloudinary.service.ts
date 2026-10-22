// ============================================================
// Cloudinary Service: Membuat tanda tangan digital (Signed Upload)
// menggunakan SHA-1 dan CLOUDINARY_API_SECRET di sisi Backend.
//
// Kenapa Signed Upload langsung dari Browser ke Cloudinary?
// 1. API Secret tetap aman di Backend (tidak pernah bocor ke Frontend).
// 2. File gambar tidak melewati body request Vercel (bebas limit 4.5 MB).
// ============================================================
import crypto from "node:crypto";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

export function createCloudinaryUploadSignature(customFolder?: string) {
  if (
    !env.CLOUDINARY_CLOUD_NAME ||
    !env.CLOUDINARY_API_KEY ||
    !env.CLOUDINARY_API_SECRET
  ) {
    throw new AppError(
      500,
      "Konfigurasi Cloudinary (CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET) belum lengkap di backend/.env",
    );
  }

  const timestamp = Math.round(Date.now() / 1000);
  const folder = customFolder || env.CLOUDINARY_FOLDER || "chistix";

  // Sesuai aturan Cloudinary: urutkan parameter berdasarkan abjad lalu tambahkan API_SECRET di ujung
  const stringToSign = `folder=${folder}&timestamp=${timestamp}${env.CLOUDINARY_API_SECRET}`;
  const signature = crypto.createHash("sha1").update(stringToSign).digest("hex");

  return {
    cloudName: env.CLOUDINARY_CLOUD_NAME,
    apiKey: env.CLOUDINARY_API_KEY,
    timestamp,
    folder,
    signature,
    uploadUrl: `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/image/upload`,
  };
}
