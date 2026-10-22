"use client";

// ============================================================
// Proteksi Role untuk seluruh halaman /organizer/*
// Jika user sedang login sebagai CUSTOMER, tolak akses ke dashboard Organizer.
// ============================================================
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function OrganizerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (isPending) return;
    const role = (session?.user as any)?.role;
    if (session?.user && String(role).toUpperCase() === "CUSTOMER") {
      alert("Akses ditolak: Akun Customer tidak dapat mengakses Dashboard Organizer.");
      router.replace("/customer/dashboard");
    }
  }, [session, isPending, router]);

  return <>{children}</>;
}
