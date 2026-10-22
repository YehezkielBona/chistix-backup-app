import nodemailer from "nodemailer";
import handlebars from "handlebars";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,         
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false, // <-- Tambahkan ini untuk mencegah blokir sertifikat lokal
  }
});

const otpEmailTemplate = `<div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
  <h2 style="color: #f58200;">Verifikasi Akun Chistix Anda</h2>
  <p>Halo <b>{{name}}</b>, klik tombol di bawah ini untuk mengaktifkan akun Anda:</p>
  
  <a href="{{url}}" style="display: inline-block; background-color: #f58200; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0;">
    Verifikasi Email Saya
  </a>
</div>
`;

export const sendVerificationEmailLink = async (
  email: string,
  name: string,
  url: string,
) => {
  try {
    const template = handlebars.compile(otpEmailTemplate);
    const htmlContent = template({ name, url });
    const info = await transporter.sendMail({
      from: `"Chistix Team" <no-reply>@chistix.id`,
      to: email,
      subject: "Aktivasi Akun Chistix",
      html: htmlContent,
    });
    // Cetak bukti fisik bahwa Gmail sudah menerbitkan Message ID
    console.log("==========================================");
    console.log("STATUS SMTP: Terkirim ke Gmail Server!");
    console.log("Message ID:", info.messageId);
    console.log("==========================================");

    return info;
  } catch (error) {
console.error("==========================================");
    console.error("STATUS SMTP email.controller: GAGAL DENGAN ERROR:", error);
    console.error("==========================================");
    throw error;
  }
};
