"use client";

// ============================================================
// Proteksi Role untuk seluruh halaman /customer/*
// Jika user sedang login sebagai ORGANIZER, arahkan ke Dashboard Organizer.
// ============================================================
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (isPending) return;
    const role = (session?.user as any)?.role;
    if (session?.user && String(role).toUpperCase() === "ORGANIZER") {
      alert("Akses ditolak: Akun Organizer tidak dapat masuk ke Dashboard Customer.");
      router.replace("/organizer/dashboard");
    }
  }, [session, isPending, router]);

  return <>{children}</>;
}
