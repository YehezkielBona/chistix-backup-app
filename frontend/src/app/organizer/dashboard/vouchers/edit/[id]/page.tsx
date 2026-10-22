"use client";

import Link from "next/link";
import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/sidebar/SidebarDashboard";
import { ChevronRightIcon, HomeIcon } from "@heroicons/react/24/outline";
import NavbarOrganizer from "@/components/menubar/navbarOrganizer";
import Footer from "@/components/menubar/footer";

export default function EditVoucherPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const voucherId = resolvedParams.id;

  // 1. State Form
  const [code, setCode] = useState("");
  const [eventId, setEventId] = useState("");
  const [discountType, setDiscountType] = useState<"PERCENTAGE" | "FIXED">("PERCENTAGE");
  const [discount, setDiscount] = useState<number | "">("");
  const [validStart, setValidStart] = useState("");
  const [validEnd, setValidEnd] = useState("");
  const [maxUsage, setMaxUsage] = useState<number>(100);

  // 2. State Daftar Event & Loading
  const [eventsList, setEventsList] = useState<{ id: string; title: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // Helper konversi format ISO Date dari DB ke YYYY-MM-DD untuk input date
  const formatDateForInput = (isoDateString?: string) => {
    if (!isoDateString) return "";
    return new Date(isoDateString).toISOString().split("T")[0];
  };

  // 3. Tarik Data Event & Detail Voucher dari Database saat dibuka
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // A. Ambil daftar event
        const eventsRes = await fetch("/api/organizer/events");
        const eventsJson = await eventsRes.json();
        if (eventsJson.success && eventsJson.data) {
          setEventsList(eventsJson.data);
        }

        // B. Ambil detail voucher yang sedang diedit
        const res = await fetch(`/api/organizer/vouchers/${voucherId}`);
        const json = await res.json();

        if (json.success && json.data) {
          const v = json.data;
          setCode(v.code || "");
          setEventId(v.eventId || "");
          setDiscountType(v.discountType || "PERCENTAGE");
          setDiscount(v.discount || 0);
          setValidStart(formatDateForInput(v.validStart));
          setValidEnd(formatDateForInput(v.validEnd));
          setMaxUsage(v.maxUsage || 100);
        } else {
          alert("Voucher tidak ditemukan!");
          router.push("/organizer/dashboard/vouchers");
        }
      } catch (err) {
        console.error("Gagal load data voucher:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (voucherId) fetchData();
  }, [voucherId, router]);

  // 4. Handle Simpan Perubahan (PUT)
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (new Date(validEnd) <= new Date(validStart)) {
      alert("Tanggal berakhir voucher harus setelah tanggal mulai!");
      return;
    }

    try {
      setIsUpdating(true);

      const payload = {
        code: code.trim().toUpperCase(),
        eventId,
        discountType,
        discount: Number(discount),
        validStart: new Date(validStart).toISOString(),
        validEnd: new Date(validEnd).toISOString(),
        maxUsage: Number(maxUsage),
      };

      const res = await fetch(`/api/organizer/vouchers/${voucherId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || "Gagal memperbarui voucher");
      }

      alert(`Voucher "${code}" berhasil diperbarui!`);
      router.push("/organizer/dashboard/vouchers");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#faf8f4] flex items-center justify-center text-sm text-neutral-500 font-medium">
        Memuat detail voucher...
      </div>
    );
  }

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
              <span className="text-neutral-900 font-semibold">Edit Voucher</span>
            </nav>

            <div className="bg-white rounded-2xl border border-neutral-100 shadow-xs p-6 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-xl font-bold text-neutral-900">Edit Voucher</h1>
                <span className="text-xs font-mono text-neutral-400 bg-neutral-100 px-2.5 py-1 rounded-md">
                  ID: {voucherId}
                </span>
              </div>

              <form onSubmit={handleUpdate} className="space-y-4 max-w-xl">
                {/* Code */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-center">
                  <label className="text-sm font-semibold text-neutral-700">Code</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="sm:col-span-2 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#bb4d00] bg-neutral-50 font-mono font-bold"
                    required
                  />
                </div>

                {/* Event Select */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-center">
                  <label className="text-sm font-semibold text-neutral-700">Event</label>
                  <select
                    value={eventId}
                    onChange={(e) => setEventId(e.target.value)}
                    className="sm:col-span-2 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#BB4D00] bg-neutral-50 cursor-pointer"
                    required
                  >
                    <option value="ALL">⭐ All Events</option>
                    {eventsList.map((evt) => (
                      <option key={evt.id} value={evt.id}>
                        {evt.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Discount Type */}
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
                      />
                      <span>Fixed Amount (Rp)</span>
                    </label>
                  </div>
                </div>

                {/* Discount Amount */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-center">
                  <label className="text-sm font-semibold text-neutral-700">Discount</label>
                  <div className="sm:col-span-2 relative flex items-center">
                    <span className="absolute left-3.5 text-xs text-neutral-400 font-semibold">
                      {discountType === "PERCENTAGE" ? "%" : "Rp"}
                    </span>
                    <input
                      type="number"
                      min={1}
                      max={discountType === "PERCENTAGE" ? 100 : undefined}
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value === "" ? "" : Number(e.target.value))}
                      className="w-full border border-neutral-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#BB4D00] bg-neutral-50"
                      required
                    />
                  </div>
                </div>

                {/* Valid Start Date */}
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

                {/* Valid End Date */}
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

                {/* Max Usage */}
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

                <div className="pt-4 flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="px-8 py-2.5 rounded-full text-sm font-semibold text-white bg-[#ea580c] hover:bg-[#bb4d00] transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {isUpdating ? "Updating..." : "Update Voucher"}
                  </button>
                  <Link
                    href="/organizer/dashboard/vouchers"
                    className="px-8 py-2.5 rounded-full text-sm font-semibold text-neutral-600 border border-neutral-200 hover:bg-neutral-100 transition-colors"
                  >
                    Cancel
                  </Link>
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