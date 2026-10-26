// ============================================================
// TITIK MASUK UTAMA BACKEND EXPRESS (server.ts)
// Arsitektur: Routes -> Controllers -> Services -> Prisma (Neon PostgreSQL)
// ============================================================
import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./controllers/auth.controller.js";
import { organizerEventRouter, publicEventRouter } from "./routes/event.routes.js";
import { organizerVoucherRouter, publicVoucherRouter } from "./routes/voucher.routes.js";
import { regionRouter, uploadRouter } from "./routes/region.routes.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import { referralRouter, customerRouter } from "./routes/customer.routes.js"; // [BARU] Tahap 4-5
import { transactionRouter, organizerTransactionRouter, cronRouter } from "./routes/transaction.routes.js"; // [BARU] Tahap 6
import { sweepOverdueTransactions } from "./services/transaction.service.js"; // [BARU] Tahap 6
import { reviewRouter, eventReviewRouter } from "./routes/review.routes.js"; // [BARU] review

export const app = express();

// 1. CORS: Izinkan akses dari Frontend Next.js (termasuk pengiriman cookie login)
const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:3000",
  process.env.BETTER_AUTH_URL || "http://localhost:3000",
];
app.use(
  cors({
    origin: (origin, callback) => {
      // Izinkan request tanpa origin (seperti proxy Next.js rewrites, Postman, curl)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  }),
);

// 2. Better Auth Handler: WAJIB dipasang SEBELUM express.json()
//    agar stream body login/register tidak habis dibaca duluan oleh express.json().
app.all("/api/auth/*splat", toNodeHandler(auth));

// 3. Body Parser JSON untuk semua endpoint REST lainnya
app.use(express.json({ limit: "10mb" }));

// 4. Endpoint cek kesehatan server
app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "chistix-express-backend",
    timestamp: new Date().toISOString(),
  });
});

// 5. Pasang semua Router
app.use("/api/organizer/events", organizerEventRouter);
app.use("/api/events", eventReviewRouter); // GET /api/events/:id/reviews
app.use("/api/reviews", reviewRouter);     // review customer
app.use("/api/events", publicEventRouter);
app.use("/api/organizer/vouchers", organizerVoucherRouter);
app.use("/api/vouchers", publicVoucherRouter);
app.use("/api/regions", regionRouter);
app.use("/api/upload", uploadRouter);
app.use("/api/referral", referralRouter); // cek kode referral
app.use("/api/customer", customerRouter); // data dashboard Overview
app.use("/api/transactions", transactionRouter); // transaksi customer
app.use("/api/organizer/transactions", organizerTransactionRouter); // accept/reject organizer
app.use("/api/cron", cronRouter); // dipanggil Vercel Cron

// 6. Handler 404 jika endpoint tidak ditemukan
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint API tidak ditemukan di server Express",
  });
});

// 7. Global Error Handler
app.use(errorHandler);

// Jalankan server jika tidak sedang di-import sebagai Serverless Function Vercel
if (process.env.VERCEL !== "1") {
  const PORT = Number(process.env.PORT) || 4000;
  app.listen(PORT, () => {
    console.log(`🚀 Chistix Express Backend berjalan di http://localhost:${PORT}`);
  });

  // BARU lokal: cek deadline transaksi setiap 1 menit
  // (di Vercel, tugas ini dikerjakan Vercel Cron lewat /api/cron/transactions)
  setInterval(() => {
    sweepOverdueTransactions().catch((err) => console.error("[sweep]", err));
  }, 60_000);
}

export default app;