// ============================================================
// Konfigurasi Better Auth di Server Express.
// Dipasang pada endpoint /api/auth/* di server.ts.
// ============================================================
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "../lib/prisma.js";
import { sendVerificationEmailLink } from "./email.controller.js";
import { sendResetPasswordEmail } from "./forgetPass.controller.js";
import { generateReferralCode } from "../services/referral.service.js"; // [BARU]

export const auth = betterAuth({
  // Harus sama dengan alamat yang dibuka di browser (localhost:3000 / domain produksi)
  baseURL:
    process.env.BETTER_AUTH_URL ||
    process.env.FRONTEND_URL ||
    "http://localhost:3000",

  // Izinkan request lintas origin dari Frontend Next.js
  trustedOrigins: [
    process.env.FRONTEND_URL || "http://localhost:3000",
    process.env.BETTER_AUTH_URL || "http://localhost:3000",
  ],

  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  user: {
    additionalFields: {
      // Sesuai enum Role di schema.prisma: CUSTOMER | ORGANIZER
      role: { type: "string", required: false, defaultValue: "CUSTOMER" },
      points: { type: "number", required: false, defaultValue: 0 },
      // [BARU] dibuat sistem. input: false = user tidak bisa mengisi atau mengubahnya
      referralCode: { type: "string", required: false, input: false },
      // TODO schema v2: referredBy: { type: "string", required: false, input: true },
    },
  },

  // [BARU] Hook: dijalankan otomatis saat user baru dibuat (daftar email maupun Google)
  databaseHooks: {
    user: {
      create: {
        before: async (user) => ({
          data: { ...user, referralCode: await generateReferralCode() },
        }),
        // TODO schema v2: after -> applyReferralReward(user.id, user.referredBy)
      },
    },
  },

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 6,
    maxPasswordLength: 64,

    // Tautan reset berlaku 1 jam (satuan detik)
    resetPasswordTokenExpiresIn: 60 * 60,
    revokeSessionsOnPasswordReset: true,

    sendResetPassword: async ({ user, url }) => {
      await sendResetPasswordEmail({ user, url });
    },
  },

  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendVerificationEmailLink(user.email, user.name || "User", url);
    },
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
});