import { transporter } from "../controllers/forgetPass.controller.js";
import { env } from "../config/env.js";

// Escape teks dari user supaya tidak bisa menyisipkan HTML ke email
const esc = (v: string) =>
  v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

type DecisionMail = {
  to: string;
  name: string;
  eventTitle: string;
  transactionId: string;
  status: "DONE" | "REJECTED";
  reason?: string | null;
};

// Email ke customer saat transaksi diterima atau ditolak organizer
export async function sendTransactionDecisionEmail(p: DecisionMail) {
  const accepted = p.status === "DONE";
  const title = accepted ? "Pembayaran kamu diterima" : "Pembayaran kamu ditolak";

  const body = accepted
    ? `E-ticket untuk <b>${esc(p.eventTitle)}</b> sudah tersedia. Unduh PDF-nya di dashboard, tab Events.`
    : `Transaksi untuk <b>${esc(p.eventTitle)}</b> ditolak organizer.` +
      (p.reason ? ` Alasan: ${esc(p.reason)}.` : "") +
      " Poin dan voucher yang dipakai sudah dikembalikan.";

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px">
      <h2 style="color:#f58200">${title}</h2>
      <p>Halo ${esc(p.name)},</p>
      <p>${body}</p>
      <p style="font-size:12px;color:#888">ID transaksi: ${p.transactionId}</p>
      <a href="${env.FRONTEND_URL}/customer/dashboard"
         style="display:inline-block;background:#f58200;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold">
        Buka Dashboard
      </a>
    </div>`;

  await transporter.sendMail({
    from: `"Chistix" <${process.env.EMAIL_USER}>`,
    to: p.to,
    subject: `${title} - ${p.eventTitle}`,
    html,
  });
}