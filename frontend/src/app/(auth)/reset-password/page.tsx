// src/app/(auth)/reset-password/page.tsx
// Halaman tujuan dari tautan di email: /reset-password?token=...
"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";

function ResetPasswordForm() {
  const params = useSearchParams();
  const token = params.get("token");
  // Better Auth menambahkan ?error=INVALID_TOKEN jika tautan salah / kedaluwarsa
  const linkInvalid = !token || params.get("error") === "INVALID_TOKEN";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "loading" || !token) return;

    if (password.length < 8) {
      setStatus("error");
      return setErrorMessage("Kata sandi minimal 8 karakter.");
    }
    if (password !== confirm) {
      setStatus("error");
      return setErrorMessage("Konfirmasi kata sandi tidak sama.");
    }

    setStatus("loading");
    setErrorMessage("");

    try {
      const { error } = await authClient.resetPassword({
        newPassword: password,
        token,
      });

      if (error) {
        setStatus("error");
        setErrorMessage(
          error.code === "INVALID_TOKEN"
            ? "Tautan sudah kedaluwarsa atau tidak valid. Silakan minta tautan baru."
            : error.status === 429
              ? "Terlalu banyak percobaan. Coba lagi dalam beberapa saat."
              : error.message || "Gagal mengubah kata sandi. Silakan coba lagi.",
        );
        return;
      }

      setStatus("success");
    } catch {
      setStatus("error");
      setErrorMessage("Koneksi bermasalah. Periksa internet Anda lalu coba lagi.");
    }
  }

  // Tautan tidak valid / token tidak ada
  if (linkInvalid) {
    return (
      <div className="space-y-4">
        <div role="alert" className="p-4 bg-red-50 text-red-600 rounded-lg">
          Tautan reset tidak valid atau sudah kedaluwarsa.
        </div>
        <Link href="/forgot-password" className="font-semibold text-amber-700 underline">
          Minta tautan baru
        </Link>
      </div>
    );
  }

  // Berhasil
  if (status === "success") {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-green-50 text-green-700 rounded-lg">
          Kata sandi berhasil diubah. Silakan login dengan kata sandi baru Anda.
        </div>
        <Link
          href="/login"
          className="inline-block w-full py-2 bg-amber-500 text-white font-bold rounded-lg hover:bg-amber-600"
        >
          Ke halaman login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-left">
      {status === "error" && (
        <div role="alert" className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">
          {errorMessage}
        </div>
      )}

      <div>
        <label htmlFor="password" className="block text-sm font-semibold mb-1">
          Kata Sandi Baru
        </label>
        <input
          id="password"
          type="password"
          required
          minLength={8}
          maxLength={64}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Minimal 8 karakter"
          className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-amber-500"
        />
      </div>

      <div>
        <label htmlFor="confirm" className="block text-sm font-semibold mb-1">
          Konfirmasi Kata Sandi
        </label>
        <input
          id="confirm"
          type="password"
          required
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Ulangi kata sandi baru"
          className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-amber-500"
        />
      </div>

      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full py-2 bg-amber-500 text-white font-bold rounded-lg hover:bg-amber-600 disabled:opacity-50"
      >
        {status === "loading" ? "Menyimpan..." : "Simpan Kata Sandi Baru"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white border rounded-xl shadow-sm text-center">
      <h2 className="text-2xl font-bold mb-4">Buat Kata Sandi Baru</h2>
      {/* Suspense dibutuhkan Next.js karena komponen membaca parameter URL */}
      <Suspense fallback={null}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}