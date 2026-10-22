import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmailLink } from "./email.controller";
import { sendResetPasswordEmail } from "./forgetPass.controller";

export const auth = betterAuth({
  // Harus sama dengan alamat yang dibuka di browser (localhost:3000 / https://chistix.id)
  baseURL:
    process.env.BETTER_AUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000",

  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  user: {
    additionalFields: {
      role: { type: "string", required: false, defaultValue: "customer" },
      points: { type: "number", required: false, defaultValue: 1 },
    },
  },

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 8,
    maxPasswordLength: 64,

    // Tautan reset berlaku 1 jam (satuan detik)
    resetPasswordTokenExpiresIn: 60 * 60,
    // Setelah password diganti, semua perangkat otomatis logout
    revokeSessionsOnPasswordReset: true,

    // PERBAIKAN: nama opsinya `sendResetPassword` (bukan `sendPasswordResetEmail`).
    // Tanpa opsi ini Better Auth menganggap fitur reset password tidak aktif.
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

// import { betterAuth } from "better-auth";
// import { prismaAdapter } from "better-auth/adapters/prisma";
// import { PrismaClient } from "@prisma/client";
// import { sendVerificationEmailLink } from "./email.controller";
// import { sendResetPasswordEmail } from "./forgetPass.controller";
// const prisma = new PrismaClient();

// export const auth = betterAuth({
//   database: prismaAdapter(prisma, {
//     provider: "postgresql",
//   }),
//   user: {
//     additionalFields: {
//       role: {
//         type: "string",
//         required: false,
//         defaultValue: "customer"
//       },
//       points: {
//         type: "number",
//         required: false,
//         defaultValue: 1
//       }
//     },
//   },
//   emailAndPassword: {
//     enabled: true,
//     requireEmailVerification: true,
//     sendPasswordResetEmail: async ({
//       user,
//       url,
//     }: {
//       user: { email: string; name?: string | null };
//       url: string;
//     }) => {
//       await sendResetPasswordEmail({ user, url });
//     },
//   },

//   emailVerification: {
//     requireEmailVerification: true,
//     sendOnSignUp: true,
//     async sendVerificationEmail({ user, url }) {

//       try {
//         await sendVerificationEmailLink(user.email, user.name || "User", url);
//       } catch (error) {
//         console.error("--> [BETTER-AUTH] ERROR SAAT MENGIRIM EMAIL:", error);
//       }
//     },
    
//   },


//   socialProviders: {
//     google: {
//       clientId: process.env.GOOGLE_CLIENT_ID as string,
//       clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
//     },
//   },
// });



// export const auth = betterAuth({
//   database: prismaAdapter(prisma, {
//     provider: "postgresql",
//   }),
//   emailAndPassword: {
//     enabled: true,
//     requireEmailVerification: true,

//     async sendVerificationEmail({ user, url }: { user: { email: string, name: string }, url: string}) {
//       // 1. CCTV Pertama: Apakah Better-Auth menyadari ada pendaftaran baru?
//       console.log("==========================================");
//       console.log("--> [BETTER-AUTH] Trigger registrasi ditangkap!");
//       console.log("--> [BETTER-AUTH] Target Email:", user.email);
//       console.log("--> [BETTER-AUTH] URL Verifikasi:", url);
//       try {
//         // 2. Memanggil fungsi pengiriman email
//         await sendVerificationEmailLink(user.email, user.name || "User", url);
//         console.log("--> [BETTER-AUTH] Eksekusi email selesai dijalankan.");
//         console.log("==========================================");
//       } catch (error) {
//         console.error("--> [BETTER-AUTH] ERROR SAAT MENGIRIM EMAIL:", error);
//       }
//     },
//   },
// socialProviders: {
//   google: {
//     clientId: process.env.GOOGLE_CLIENT_ID as string,
//     clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
//   },
// },
// });
