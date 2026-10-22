"use client";

import Link from "next/link";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/sidebar/SidebarDashboard";
import { ChevronRightIcon, HomeIcon } from "@heroicons/react/24/outline";
import NavbarOrganizer from "@/components/menubar/navbarOrganizer";
import Footer from "@/components/menubar/footer";

export default function CreateVoucherPage() {
  const router = useRouter();

  // 1. State untuk Form Voucher
  const [code, setCode] = useState("");
  const [eventId, setEventId] = useState(""); // Menyimpan ID Event terpilih atau "ALL"
  const [discountType, setDiscountType] = useState<"PERCENTAGE" | "FIXED">("PERCENTAGE");
  const [discount, setDiscount] = useState<number | "">("");
  const [validStart, setValidStart] = useState("");
  const [validEnd, setValidEnd] = useState("");
  const [maxUsage, setMaxUsage] = useState<number>(100);

  // 2. State untuk Data Event dari Database Neon & Status Loading
  const [eventsList, setEventsList] = useState<{ id: string; title: string; status: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 3. Tarik Event dari Database saat halaman dibuka
  useEffect(() => {
    const fetchAvailableEvents = async () => {
      try {
        const res = await fetch("/api/organizer/events");
        const json = await res.json();
        if (json.success && json.data) {
          // Filter hanya event dengan status DRAFT atau UPCOMING (sesuai aturanmu!)
          const filtered = json.data.filter((evt: any) => {
            const st = (evt.status || "").replace(/\s+/g, "_").toUpperCase();
            return st === "DRAFT" || st === "UPCOMING";
          });
          setEventsList(filtered);
        }
      } catch (err) {
        console.error("Gagal memuat daftar event:", err);
      }
    };

    fetchAvailableEvents();
  }, []);

  // 4. Handle Submit ke Backend
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code || !eventId || !discount || !validStart || !validEnd) {
      alert("Harap lengkapi seluruh field yang wajib diisi!");
      return;
    }

    if (new Date(validEnd) <= new Date(validStart)) {
      alert("Tanggal berakhir voucher harus setelah tanggal mulai!");
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        code: code.trim().toUpperCase(),
        eventId,
        discountType,
        discount: Number(discount),
        validStart: new Date(validStart).toISOString(),
        validEnd: new Date(validEnd).toISOString(),
        maxUsage: Number(maxUsage) || 100,
      };

      const res = await fetch("/api/organizer/vouchers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || "Gagal membuat voucher");
      }

      alert(`Berhasil membuat voucher "${code}"!`);
      router.push("/organizer/dashboard/vouchers");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f4] text-neutral-800 font-sans flex flex-col justify-between">
      <NavbarOrganizer />
      <div className="flex-1 w-full p-4 md:p-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-6 items-start">
          <Sidebar />

          <div className="flex-1 w-full space-y-4">
            {/* Breadcrumb Nav */}
            <nav className="flex items-center gap-1.5 text-xs md:text-sm text-neutral-500">
              <Link href="/organizer/dashboard" className="flex items-center gap-1 hover:text-[#bb4d00] font-medium">
                <HomeIcon className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </Link>
              <ChevronRightIcon className="w-3.5 h-3.5 text-neutral-300" />
              <Link href="/organizer/dashboard/vouchers" className="hover:text-[#bb4d00] font-medium">
                Voucher
              </Link>
              <ChevronRightIcon className="w-3.5 h-3.5 text-neutral-300" />
              <span className="text-neutral-900 font-semibold">Create New Voucher</span>
            </nav>

            <div className="bg-white rounded-2xl border border-neutral-100 shadow-xs p-6 md:p-8">
              <h1 className="text-xl font-bold text-neutral-900 mb-6">Create New Voucher</h1>

              <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
                {/* 1. Code Voucher */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-center">
                  <label className="text-sm font-semibold text-neutral-700">Code</label>
                  <input
                    type="text"
                    placeholder="Contoh: PROMO10 / DISC50K"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="sm:col-span-2 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#bb4d00] bg-neutral-50 font-mono font-bold"
                    required
                  />
                </div>

                {/* 2. Choose Event (Dinamis dari DB + Opsi "All Event") */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-center">
                  <label className="text-sm font-semibold text-neutral-700">Event</label>
                  <select
                    value={eventId}
                    onChange={(e) => setEventId(e.target.value)}
                    className="sm:col-span-2 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#BB4D00] bg-neutral-50 cursor-pointer"
                    required
                  >
                    <option value="">-- Choose Event --</option>
                    <option value="ALL" className="font-bold text-[#bb4d00]">
                      ⭐ All Events (Semua Event Aktif)
                    </option>
                    {eventsList.map((evt) => (
                      <option key={evt.id} value={evt.id}>
                        {evt.title} ({evt.status})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Discount Type (Persentase atau Nominal) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-center">
                  <label className="text-sm font-semibold text-neutral-700">Discount Type</label>
                  <div className="sm:col-span-2 flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input
                        type="radio"
                        name="discountType"
                        value="PERCENTAGE"
                        checked={discountType === "PERCENTAGE"}
                        onChange={() => setDiscountType("PERCENTAGE")}
                        className="text-[#ea580c] focus:ring-[#ea580c]"
                      />
                      <span>Percentage (%)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input
                        type="radio"
                        name="discountType"
                        value="FIXED"
                        checked={discountType === "FIXED"}
                        onChange={() => setDiscountType("FIXED")}
                        className="text-[#ea580c] focus:ring-[#ea580c]"
                      />
                      <span>Fixed Amount (Rp)</span>
                    </label>
                  </div>
                </div>

                {/* 4. Discount Amount */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-center">
                  <label className="text-sm font-semibold text-neutral-700">Discount Amount</label>
                  <div className="sm:col-span-2 relative flex items-center">
                    <span className="absolute left-3.5 text-xs text-neutral-400 font-semibold">
                      {discountType === "PERCENTAGE" ? "%" : "Rp"}
                    </span>
                    <input
                      type="number"
                      min={1}
                      max={discountType === "PERCENTAGE" ? 100 : undefined}
                      placeholder={discountType === "PERCENTAGE" ? "Contoh: 10 (artinya 10%)" : "Contoh: 50000"}
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value === "" ? "" : Number(e.target.value))}
                      className="w-full border border-neutral-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#BB4D00] bg-neutral-50"
                      required
                    />
                  </div>
                </div>

                {/* 5. Valid Start Date */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-center">
                  <label className="text-sm font-semibold text-neutral-700">Valid Start</label>
                  <input
                    type="date"
                    value={validStart}
                    onChange={(e) => setValidStart(e.target.value)}
                    className="sm:col-span-2 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#BB4D00] bg-neutral-50 cursor-pointer"
                    required
                  />
                </div>

                {/* 6. Valid End Date */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-center">
                  <label className="text-sm font-semibold text-neutral-700">Valid End</label>
                  <input
                    type="date"
                    value={validEnd}
                    onChange={(e) => setValidEnd(e.target.value)}
                    className="sm:col-span-2 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#BB4D00] bg-neutral-50 cursor-pointer"
                    required
                  />
                </div>

                {/* 7. Max Usage */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-center">
                  <label className="text-sm font-semibold text-neutral-700">Max Usage Quota</label>
                  <input
                    type="number"
                    min={1}
                    value={maxUsage}
                    onChange={(e) => setMaxUsage(Number(e.target.value))}
                    className="sm:col-span-2 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#BB4D00] bg-neutral-50"
                    required
                  />
                </div>

                {/* Tombol Action */}
                <div className="flex justify-end pt-4 gap-4">
                  <Link
                    href="/organizer/dashboard/vouchers"
                    className="px-8 py-2.5 rounded-full text-sm font-semibold text-neutral-600 border border-neutral-200 hover:bg-neutral-100 transition-colors"
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-8 py-2.5 rounded-full text-sm font-semibold text-white bg-[#ea580c] hover:bg-[#bb4d00] transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {isSubmitting ? "Creating..." : "Create Voucher"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}