// ============================================================
// Better Auth Client untuk Frontend Next.js.
// Semua request auth (/api/auth/*) otomatis diteruskan ke Express
// melalui konfigurasi rewrites di next.config.ts.
// ============================================================
import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  plugins: [
    // Deklarasi field tambahan User sesuai dengan backend/src/controllers/auth.controller.ts
    inferAdditionalFields({
      user: {
        role: { type: "string", required: false },
        points: { type: "number", required: false },
        referralCode: { type: "string", required: false }, // [BARU]
      },
    }),
  ],
});
