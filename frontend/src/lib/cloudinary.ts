// ============================================================
// Helper Upload Gambar ke Cloudinary (Signed Upload via Backend Express)
//
// Alur kerja:
// 1. Frontend meminta tanda tangan (signature) ke POST /api/upload/signature (Express).
// 2. Backend membuat signature SHA-1 memakai CLOUDINARY_API_SECRET dari backend/.env.
// 3. Frontend mengirim file gambar langsung ke API Cloudinary dan menerima secure_url.
// ============================================================

export async function uploadImageToCloudinary(
  file: File,
  folder = "chistix",
): Promise<string> {
  // 1. Minta signature dari Backend Express
  const sigRes = await fetch("/api/upload/signature", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ folder }),
  });

  const sigJson = await sigRes.json();
  if (!sigRes.ok || !sigJson.success) {
    throw new Error(sigJson.message || "Gagal meminta signature upload dari server");
  }

  const { apiKey, timestamp, signature, uploadUrl, folder: targetFolder } = sigJson.data;

  // 2. Kirim file ke Cloudinary menggunakan FormData
  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", String(apiKey));
  formData.append("timestamp", String(timestamp));
  formData.append("signature", String(signature));
  formData.append("folder", String(targetFolder));

  const uploadRes = await fetch(uploadUrl, {
    method: "POST",
    body: formData,
  });

  const uploadJson = await uploadRes.json();
  if (!uploadRes.ok || !uploadJson.secure_url) {
    throw new Error(
      uploadJson?.error?.message || "Gagal mengunggah gambar ke Cloudinary",
    );
  }

  // 3. Kembalikan URL HTTPS gambar dari Cloudinary
  return String(uploadJson.secure_url);
}
