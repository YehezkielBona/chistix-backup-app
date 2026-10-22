import nodemailer from "nodemailer";

const port = Number(process.env.SMTP_PORT) || 465;

// Dibuat SEKALI (bukan di setiap pengiriman) agar koneksi dipakai ulang.
// Diekspor agar bisa dipakai route uji /api/debug/smtp.
export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST, // contoh: smtp.gmail.com
  port,
  // secure hanya true untuk port 465. Port 587 memakai STARTTLS (secure: false).
  secure: port === 465,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

// Variabel env yang wajib ada. Mengembalikan daftar yang KOSONG.
export const missingSmtpEnv = () =>
  ["SMTP_HOST", "EMAIL_USER", "EMAIL_APP_PASSWORD"].filter((key) => !process.env[key]);

// Nama pengguna berasal dari input pengguna -> di-escape agar tidak menyisipkan HTML ke email
const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export const sendResetPasswordEmail = async ({
  user,
  url,
}: {
  user: { email: string; name?: string | null };
  url: string;
}) => {
  // LOG 1: jika baris ini TIDAK muncul di terminal, Better Auth tidak memanggil fungsi ini
  // (artinya user tidak ditemukan di database), bukan masalah SMTP.
  console.log(`[reset-email] sendResetPassword dipanggil untuk ${user.email}`);

  const missing = missingSmtpEnv();
  if (missing.length > 0) {
    console.error(`[reset-email] GAGAL: variabel env belum terisi: ${missing.join(", ")}`);
    return;
  }

  const name = escapeHtml(user.name || "User");

  try {
    const info = await transporter.sendMail({
      from: `"Chistix Support" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Reset Kata Sandi Anda - Chistix",
      text: `Halo ${user.name || "User"},\n\nBuka tautan berikut untuk membuat kata sandi baru (berlaku 1 jam):\n${url}\n\nJika Anda tidak meminta ini, abaikan email ini.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Halo ${name},</h2>
          <p>Anda menerima email ini karena ada permintaan reset kata sandi untuk akun Anda.</p>
          <p>Klik tombol di bawah ini untuk membuat kata sandi baru. Tautan berlaku selama <strong>1 jam</strong>.</p>
          <a href="${url}" style="display: inline-block; padding: 10px 20px; color: white; background-color: #f89c1e; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Kata Sandi</a>
          <p style="margin-top: 20px; font-size: 12px; color: gray;">
            Jika tombol tidak berfungsi, salin dan tempel tautan ini ke browser Anda: <br/> ${url}
          </p>
          <p>Jika Anda tidak meminta ini, abaikan saja email ini.</p>
        </div>
      `,
    });

    // LOG 2: bukti server SMTP menerima email. "accepted" berisi alamat tujuan.
    console.log("[reset-email] TERKIRIM", {
      accepted: info.accepted,
      rejected: info.rejected,
      response: info.response,
    });
  } catch (error) {
    // LOG 3: penyebab kegagalan SMTP yang sebelumnya tersembunyi
    console.error("[reset-email] GAGAL mengirim email:", error);
  }
};