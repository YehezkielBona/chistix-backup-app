// src/app/(auth)/forgot-password/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

const COOLDOWN_SECONDS = 60;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [cooldown, setCooldown] = useState(0);

  // Hitung mundur untuk tombol "Kirim ulang" (mencegah spam email)
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function sendResetLink() {
    setStatus("loading");
    setErrorMessage("");

    try {
      // PERBAIKAN: nama method yang benar adalah requestPasswordReset
      // (forgetPassword sudah diganti; memanggilnya menghasilkan 404 dan harus dipaksa dengan `as any`)
      const { error } = await authClient.requestPasswordReset({
        email: email.trim().toLowerCase(),
        redirectTo: "/reset-password", // halaman tujuan setelah tautan di email diklik
      });

      // PERBAIKAN: yang diperiksa adalah `error` hasil panggilan, bukan `Error` bawaan JavaScript
      // (objek Error selalu "true", jadi sebelumnya status selalu menjadi error).
      if (error) {
        setStatus("error");
        setErrorMessage(
          error.status === 429
            ? "Terlalu banyak percobaan. Coba lagi dalam beberapa saat."
            : error.message || "Gagal mengirim email. Silakan coba lagi.",
        );
        return;
      }

      setStatus("success");
      setCooldown(COOLDOWN_SECONDS);
    } catch {
      setStatus("error");
      setErrorMessage("Koneksi bermasalah. Periksa internet Anda lalu coba lagi.");
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "loading") return; // cegah klik ganda
    void sendResetLink();
  }

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white border rounded-xl shadow-sm text-center">
      <h2 className="text-2xl font-bold mb-4">Lupa Kata Sandi</h2>

      {status === "success" ? (
        <div className="space-y-4">
          <div className="p-4 bg-green-50 text-green-700 rounded-lg text-left">
            Jika <strong>{email}</strong> terdaftar, kami telah mengirim tautan reset kata sandi.
            Periksa kotak masuk dan folder spam. Tautan berlaku selama 1 jam.
          </div>

          <button
            type="button"
            onClick={() => void sendResetLink()}
            disabled={cooldown > 0}
            className="text-sm font-semibold text-amber-700 underline disabled:text-gray-400 disabled:no-underline disabled:cursor-not-allowed"
          >
            {cooldown > 0 ? `Kirim ulang dalam ${cooldown} detik` : "Kirim ulang tautan"}
          </button>

          <div>
            <button
              type="button"
              onClick={() => setStatus("idle")}
              className="text-sm text-gray-600 underline"
            >
              Gunakan email lain
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          {status === "error" && (
            <div role="alert" className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">
              {errorMessage}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-semibold mb-1">
              Alamat Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Masukkan email Anda"
              className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full py-2 bg-amber-500 text-white font-bold rounded-lg hover:bg-amber-600 disabled:opacity-50"
          >
            {status === "loading" ? "Mengirim..." : "Kirim Link Reset"}
          </button>

          <p className="text-center text-sm">
            <Link href="/login" className="text-gray-600 underline">
              Kembali ke login
            </Link>
          </p>
        </form>
      )}
    </div>
  );
}