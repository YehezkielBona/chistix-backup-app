import "dotenv/config"; // WAJIB di baris paling atas agar variabel .env dibaca duluan
import { sendVerificationEmailLink } from "./src/controllers/email.controller";

async function runTest() {
  console.log("--> Cek EMAIL_USER:", process.env.EMAIL_USER);
  console.log("--> Cek EMAIL_APP_PASSWORD terisi:", !!process.env.EMAIL_APP_PASSWORD);

  try {
    await sendVerificationEmailLink(
      "aluminos09@gmail.com",
      "Imam Test",
      "http://localhost:3000/?verified=true"
    );
    console.log("=== TES MANDIRI BERHASIL ===");
  } catch (err) {
    console.error("=== TES MANDIRI GAGAL ===", err);
  }
}

runTest();