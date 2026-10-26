import crypto from "node:crypto";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/AppError.js";

// Rapikan kode: hapus spasi, huruf besar semua
export const normalizeCode = (code?: string | null) =>
  code ? code.trim().toUpperCase() : null;

// Buat kode CHX-XXXXXX dan pastikan belum dipakai user lain
export async function generateReferralCode(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = `CHX-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
    // TODO schema v2: ganti findFirst -> findUnique setelah referralCode diberi @unique
    const taken = await prisma.user.findFirst({ where: { referralCode: code }, select: { id: true } });
    if (!taken) return code;
  }
  throw new AppError(500, "Gagal membuat kode referral, coba lagi");
}

// GET /api/referral/check?code=... : dipakai form register sebelum submit
export async function checkReferralCodeService(rawCode: string) {
  const code = normalizeCode(rawCode);
  if (!code) return { valid: false };
  const owner = await prisma.user.findFirst({ where: { referralCode: code }, select: { name: true } });
  return owner ? { valid: true, ownerName: owner.name } : { valid: false };
}

// TODO schema v2: applyReferralReward (poin +10.000 untuk pemilik kode, kupon untuk user baru)