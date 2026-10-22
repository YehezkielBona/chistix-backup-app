// Script untuk menguji pengiriman email SMTP dari folder backend
import { sendVerificationEmailLink } from "../src/controllers/email.controller.js";

async function runTest() {
  console.log("--> Cek EMAIL_USER:", process.env.EMAIL_USER);
  console.log("--> Cek EMAIL_APP_PASSWORD terisi:", !!process.env.EMAIL_APP_PASSWORD);

  try {
    await sendVerificationEmailLink(
      process.env.EMAIL_USER || "test@example.com",
      "Tester Chistix",
      "http://localhost:3000/login",
    );
    console.log("--> Pengiriman email tes berhasil.");
  } catch (err) {
    console.error("--> Pengiriman email tes gagal:", err);
  }
}

runTest();
