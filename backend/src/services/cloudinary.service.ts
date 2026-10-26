// ============================================================
// Cloudinary Service: Membuat tanda tangan digital (Signed Upload)
// menggunakan SHA-1 dan CLOUDINARY_API_SECRET di sisi Backend.
//
// Kenapa Signed Upload langsung dari Browser ke Cloudinary?
// 1. API Secret tetap aman di Backend (tidak pernah bocor ke Frontend).
// 2. File gambar tidak melewati body request Vercel (bebas limit 4.5 MB).
// ============================================================
import crypto from "node:crypto";
import { v2 as cloudinary } from "cloudinary";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

// BARU: cek env sekali, dipakai di signature maupun upload server
function assertCloudinaryConfigured() {
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    throw new AppError(
      500,
      "Konfigurasi Cloudinary (CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET) belum lengkap di backend/.env",
    );
  }
}

// BARU: konfigurasi SDK Cloudinary (dibaca sekali saat server start)
cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true, // URL hasil upload selalu https
});

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


// BARU: SERVER UPLOAD

// Upload file dari RAM (buffer hasil Multer memoryStorage) ke Cloudinary
export function uploadImageBuffer(buffer: Buffer, folder: string): Promise<{ url: string; publicId: string }> {
  assertCloudinaryConfigured();
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (error, result) => {
        if (error || !result) return reject(new AppError(502, "Gagal mengunggah file ke Cloudinary"));
        resolve({ url: result.secure_url, publicId: result.public_id });
      },
    );
    stream.end(buffer); // kirim isi file ke stream
  });
}

// Hapus file lama dari Cloudinary (requirement: file lama dihapus saat diganti)
export async function deleteImage(publicId: string) {
  await cloudinary.uploader.destroy(publicId);
}

// Ambil public_id dari URL Cloudinary, karena di database yang disimpan hanya URL-nya
// contoh: .../image/upload/v1729000000/chistix/payment-proofs/abc123.jpg
//      -> "chistix/payment-proofs/abc123"
export function publicIdFromUrl(url: string): string | null {
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-z0-9]+$/i);
  return match ? match[1] : null;
}