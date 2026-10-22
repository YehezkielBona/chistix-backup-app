// ROUTE UJI SEMENTARA: hapus file ini setelah masalah email selesai.
// Cara pakai (saat npm run dev):
//   http://localhost:3000/api/debug/smtp                      -> cek koneksi + login SMTP
//   http://localhost:3000/api/debug/smtp?to=emailanda@gmail.com -> kirim email tes
import { NextResponse } from "next/server";
import { missingSmtpEnv, transporter } from "@/controllers/forgetPass.controller";

export async function GET(request: Request) {
  // Tidak aktif di produksi
  if (process.env.NODE_ENV === "production") {
    return new NextResponse("Not found", { status: 404 });
  }

  // Hanya menampilkan apakah env terisi (true/false), tidak pernah menampilkan nilainya
  const env = {
    SMTP_HOST: Boolean(process.env.SMTP_HOST),
    SMTP_PORT: process.env.SMTP_PORT ?? "(kosong, memakai 465)",
    SMTP_USER: Boolean(process.env.SMTP_USER),
    SMTP_PASSWORD: Boolean(process.env.SMTP_PASSWORD),
    // Nama variabel (BUKAN nilainya) yang mengandung "smtp" atau "mail".
    // Membantu menemukan variabel yang salah nama, mis. SMTP_PASS atau EMAIL_USER.
    namaEnvMirip: Object.keys(process.env).filter((key) => /smtp|mail/i.test(key)),
  };

  const missing = missingSmtpEnv();
  if (missing.length > 0) {
    return NextResponse.json(
      { ok: false, step: "env", env, error: `Env belum terisi: ${missing.join(", ")}` },
      { status: 500 },
    );
  }

  try {
    // Langkah 1: tes koneksi dan login ke server SMTP
    await transporter.verify();

    const to = new URL(request.url).searchParams.get("to");
    if (!to) {
      return NextResponse.json({
        ok: true,
        env,
        verify: "Koneksi dan login SMTP berhasil",
        next: "Tambahkan ?to=emailanda@gmail.com di alamat untuk mengirim email tes",
      });
    }

    // Langkah 2: kirim email tes
    const info = await transporter.sendMail({
      from: `"Chistix Support" <${process.env.SMTP_USER}>`,
      to,
      subject: "Tes SMTP Chistix",
      text: "Jika Anda menerima email ini, pengaturan SMTP sudah benar.",
    });

    return NextResponse.json({
      ok: true,
      env,
      verify: "Koneksi dan login SMTP berhasil",
      sent: { accepted: info.accepted, rejected: info.rejected, response: info.response },
    });
  } catch (error) {
    const e = error as {
      message?: string;
      code?: string;
      command?: string;
      responseCode?: number;
      response?: string;
    };
    return NextResponse.json(
      {
        ok: false,
        env,
        error: {
          message: e.message,
          code: e.code,
          command: e.command,
          responseCode: e.responseCode,
          response: e.response,
        },
      },
      { status: 500 },
    );
  }
}