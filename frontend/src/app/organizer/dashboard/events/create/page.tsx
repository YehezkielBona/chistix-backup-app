"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SidebarDashboard from "@/components/sidebar/SidebarDashboard";
import { ChevronRightIcon, HomeIcon } from "@heroicons/react/24/outline";
import { EventFormData } from "@/types/event";
import NavbarOrganizer from "@/components/menubar/navbarOrganizer";
import Footer from "@/components/menubar/footer";

const PROVINCES = [
  "DKI Jakarta",
  "Jawa Barat",
  "Jawa Tengah",
  "Jawa Timur",
  "Bali",
  "Sumatera Utara",
];

const CITIES: Record<string, string[]> = {
  "DKI Jakarta": ["Jakarta Pusat", "Jakarta Selatan", "Jakarta Barat", "Jakarta Timur", "Jakarta Utara"],
  "Jawa Barat": ["Bandung", "Bekasi", "Depok", "Bogor", "Cimahi"],
  "Jawa Tengah": ["Semarang", "Solo", "Magelang", "Yogyakarta"],
  "Jawa Timur": ["Surabaya", "Malang", "Sidoarjo", "Gresik"],
  "Bali": ["Denpasar", "Kuta", "Ubud", "Seminyak"],
  "Sumatera Utara": ["Medan", "Binjai", "Pematang Siantar"],
};

export default function CreateEventPage() {
  const router = useRouter();

  // State Form Utama
  const [form, setForm] = useState<Partial<EventFormData>>({
    title: "",
    category: "Music",
    description: "",
    province: "",
    city: "",
    venueMaps: "",
    venueDetail: "",
    presale: { enabled: false, amount: 0, startDate: "", endDate: "" },
    thumbnailImage: "",
    coverImages: [],
    videoUrl: "",
    scheduledPublishStart: "",
    scheduledPublishEnd: "",
  });

  // State Tanggal & Jam Mulai - Selesai
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // State Kuota & Harga Tier Tiket
  const [totalTicket, setTotalTicket] = useState<number>(0);
  const [vipQuota, setVipQuota] = useState<number>(0);
  const [vipPrice, setVipPrice] = useState<number>(0);
  const [vipFinalPrice, setVipFinalPrice] = useState<number>(0);

  const [regularQuota, setRegularQuota] = useState<number>(0);
  const [regularPrice, setRegularPrice] = useState<number>(0);
  const [regularFinalPrice, setRegularFinalPrice] = useState<number>(0);

  const [presaleQuota, setPresaleQuota] = useState<number>(0);

  // State Peringatan Validasi Tier Tiket
  const [tierWarning, setTierWarning] = useState(false);

  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Kalkulasi Kuota (Di dalam fungsi agar membaca semua state dengan benar)
  const allocatedQuota = vipQuota + regularQuota + (form.presale?.enabled ? presaleQuota : 0);
  const remainingQuota = totalTicket - allocatedQuota;

  const handleChange = (field: keyof EventFormData, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveDraft = () => {
    alert("Event saved as Draft!");
    router.push("/organizer/dashboard/events");
  };

  const handlePublish = async () => {
    if (!agreedToTerms) {
      alert("Harap setujui Terms & Conditions terlebih dahulu!");
      return;
    }

    if (!form.title || !startDate || !endDate || !form.description || !form.province || !form.city || !form.venueDetail) {
      alert("Harap lengkapi semua field yang wajib diisi!");
      return;
    }

    if (totalTicket <= 0) {
      alert("Total Ticket Amount harus lebih besar dari 0!");
      return;
    }

    if (remainingQuota !== 0) {
      alert(`Alokasi kuota tiket belum pas! Sisa kuota: ${remainingQuota} tiket. Total pembagian VIP + Regular + Presale harus tepat sama dengan ${totalTicket}!`);
      return;
    }

    try {
      // Susun Payload Sesuai Schema Zod Backend
      const payload = {
        title: form.title,
        category: (form.category || "MUSIC").toUpperCase(),
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        description: form.description,
        province: form.province,
        city: form.city,
        venueDetail: form.venueDetail,
        venueMaps: form.venueMaps || "",
        totalTicket: Number(totalTicket),
        ticketTiers: [
          {
            name: "VIP",
            price: Number(vipPrice),
            finalPrice: Number(vipFinalPrice || vipPrice),
            quota: Number(vipQuota),
          },
          {
            name: "Regular",
            price: Number(regularPrice),
            finalPrice: Number(regularFinalPrice || regularPrice),
            quota: Number(regularQuota),
          },
        ],
        presale: form.presale?.enabled
          ? {
              enabled: true,
              amount: Number(presaleQuota),
              startDate: form.presale.startDate,
              endDate: form.presale.endDate,
            }
          : { enabled: false },
      };

      const res = await fetch("/api/organizer/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || "Gagal membuat event");
      }

      alert("🎉 Sukses! Event berhasil dibuat dan tersimpan di database Neon!");
      router.push("/organizer/dashboard/events");
    } catch (err: any) {
      console.error(err);
      alert("Terjadi kesalahan: " + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F4] text-neutral-800 font-sans flex flex-col justify-between">
      <NavbarOrganizer />
      <div className="flex-1 w-full p-4 md:p-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-6 items-start">
        <SidebarDashboard />

        <div className="flex-1 w-full space-y-4">
          {/* Breadcrumb Nav */}
          <nav className="flex items-center gap-1.5 text-xs md:text-sm text-neutral-500">
            <Link
              href="/organizer/dashboard"
              className="flex items-center gap-1 hover:text-[#BB4D00] transition-colors font-medium"
            >
              <HomeIcon className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </Link>

            <ChevronRightIcon className="w-3.5 h-3.5 text-neutral-300" />

            <Link
              href="/organizer/dashboard/events"
              className="hover:text-[#BB4D00] transition-colors font-medium"
            >
              Events
            </Link>

            <ChevronRightIcon className="w-3.5 h-3.5 text-neutral-300" />

            <span className="text-neutral-900 font-semibold">Create New Event</span>
          </nav>

          <div className="bg-white rounded-2xl border border-neutral-100 shadow-xs overflow-hidden">
            <div className="p-6 md:p-8 space-y-5">
              
              {/* Event Title */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-start">
                <label className="text-sm font-medium text-neutral-700 pt-2.5">Event Title</label>
                <input
                  type="text"
                  placeholder="Nama event..."
                  value={form.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  className="sm:col-span-2 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#BB4D00] bg-neutral-50"
                  required
                />
              </div>

              {/* Event Category */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-start">
                <label className="text-sm font-medium text-neutral-700 pt-2.5">Event Category</label>
                <select
                  value={form.category}
                  onChange={(e) => handleChange("category", e.target.value)}
                  className="sm:col-span-2 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#BB4D00] bg-neutral-50 cursor-pointer"
                >
                  <option value="Music">Music</option>
                  <option value="Seminar">Seminar</option>
                  <option value="Talkshow">Talkshow</option>
                  <option value="Sports">Sports</option>
                  <option value="Exhibition">Exhibition</option>
                </select>
              </div>

              {/* 1. JADWAL EVENT (START & END DATE-TIME) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-start">
                <label className="text-sm font-medium text-neutral-700 pt-2.5">
                  Event Schedule
                </label>
                <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-xs text-neutral-400 block mb-1">Start Date & Time (Live On Stage)</span>
                    <input
                      type="datetime-local"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#BB4D00] bg-neutral-50 cursor-pointer"
                      required
                    />
                  </div>
                  <div>
                    <span className="text-xs text-neutral-400 block mb-1">End Date & Time (Event Ended)</span>
                    <input
                      type="datetime-local"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#BB4D00] bg-neutral-50 cursor-pointer"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Event Description */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-start">
                <label className="text-sm font-medium text-neutral-700 pt-2.5">Event Description</label>
                <textarea
                  rows={4}
                  placeholder="Deskripsi lengkap event..."
                  value={form.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  className="sm:col-span-2 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#BB4D00] bg-neutral-50 resize-none"
                  required
                />
              </div>

              {/* Province */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-start">
                <label className="text-sm font-medium text-neutral-700 pt-2.5">Location Province</label>
                <select
                  value={form.province}
                  onChange={(e) => {
                    handleChange("province", e.target.value);
                    handleChange("city", "");
                  }}
                  className="sm:col-span-2 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#BB4D00] bg-neutral-50 cursor-pointer"
                  required
                >
                  <option value="">Select Province</option>
                  {PROVINCES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              {/* City */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-start">
                <label className="text-sm font-medium text-neutral-700 pt-2.5">Location City</label>
                <select
                  value={form.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                  disabled={!form.province}
                  className="sm:col-span-2 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#BB4D00] bg-neutral-50 disabled:opacity-50 cursor-pointer"
                  required
                >
                  <option value="">Select City</option>
                  {(CITIES[form.province ?? ""] ?? []).map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Venue Location Maps */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-start">
                <label className="text-sm font-medium text-neutral-700 pt-2.5">Venue Location Maps</label>
                <input
                  type="url"
                  placeholder="https://maps.google.com/..."
                  value={form.venueMaps}
                  onChange={(e) => handleChange("venueMaps", e.target.value)}
                  className="sm:col-span-2 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#BB4D00] bg-neutral-50"
                />
              </div>

              {/* Venue Location Detail */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-start">
                <label className="text-sm font-medium text-neutral-700 pt-2.5">Venue Location Detail</label>
                <input
                  type="text"
                  placeholder="Nama gedung, jalan, detail lokasi..."
                  value={form.venueDetail}
                  onChange={(e) => handleChange("venueDetail", e.target.value)}
                  className="sm:col-span-2 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#BB4D00] bg-neutral-50"
                  required
                />
              </div>

              {/* 2. TOTAL TICKET AMOUNT (PLAFON MAKSIMAL KUOTA) */}
              {/* 2. TOTAL TICKET AMOUNT (PLAFON MAKSIMAL KUOTA) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-center">
                <label className="text-sm font-medium text-neutral-700">Total Ticket Amount</label>
                <div className="sm:col-span-2 flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    onWheel={(e) => e.currentTarget.blur()}
                    placeholder="Contoh: 500"
                    value={totalTicket || ""}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setTotalTicket(val);
                      if (val > 0) {
                        setTierWarning(false);
                      }
                      setVipQuota(0);
                      setRegularQuota(0);
                      setPresaleQuota(0);
                    }}
                    className="w-36 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#BB4D00] bg-neutral-50 font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    required
                  />
                  <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${
                    totalTicket === 0
                      ? "bg-neutral-100 text-neutral-500"
                      : remainingQuota === 0
                      ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                      : remainingQuota < 0
                      ? "bg-rose-100 text-rose-700 border border-rose-200"
                      : "bg-amber-100 text-amber-700 border border-amber-200"
                  }`}>
                    {totalTicket === 0
                      ? "Isi total kuota dahulu"
                      : remainingQuota === 0
                      ? "✅ Kuota pas terbagi!"
                      : remainingQuota < 0
                      ? `⚠️ Kelebihan ${Math.abs(remainingQuota)} tiket!`
                      : `Sisa Kuota: ${remainingQuota} tiket`}
                  </span>
                </div>
              </div>

              {/* Peringatan jika belum isi Total Ticket Amount */}
              {tierWarning && (!totalTicket || totalTicket <= 0) && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-semibold animate-pulse">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>You must fill the Total Ticket Amount, before you fill the Ticket Tier</span>
                </div>
              )}

              <div className="border-t border-neutral-100 pt-2" />

              {/* TICKET TIERS WRAPPER (DISABLED JIKA TOTAL BELUM DIISI) */}
              <div className={`relative space-y-4 ${!totalTicket || totalTicket <= 0 ? "opacity-60" : ""}`}>
                {/* Transparent overlay untuk menangkap klik saat tier nonaktif */}
                {(!totalTicket || totalTicket <= 0) && (
                  <div
                    onClick={() => setTierWarning(true)}
                    className="absolute inset-0 z-20 cursor-not-allowed bg-transparent"
                    title="You must fill the Total Ticket Amount, before you fill the Ticket Tier"
                  />
                )}

                {/* 3. VIP TIER */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-center">
                  <label className="text-sm font-medium text-neutral-700 pl-4">VIP</label>
                  <div className="sm:col-span-2 flex flex-wrap gap-2.5 items-center text-xs text-neutral-500">
                    <input
                      type="number"
                      min={0}
                      max={vipQuota + remainingQuota}
                      disabled={!totalTicket || totalTicket <= 0}
                      onWheel={(e) => e.currentTarget.blur()}
                      placeholder="Quota"
                      value={vipQuota || ""}
                      onChange={(e) => setVipQuota(Number(e.target.value))}
                      className="w-20 border border-neutral-200 rounded-lg px-2.5 py-2 focus:outline-none focus:border-[#BB4D00] bg-neutral-50 text-sm disabled:opacity-40 font-semibold text-neutral-900 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span>Normal Price</span>
                    <div className="relative flex items-center">
                      <span className="absolute left-2.5 text-xs text-neutral-400 font-semibold">IDR</span>
                      <input
                        type="number"
                        min={0}
                        disabled={!totalTicket || totalTicket <= 0}
                        onWheel={(e) => e.currentTarget.blur()}
                        placeholder="0"
                        value={vipPrice || ""}
                        onChange={(e) => setVipPrice(Number(e.target.value))}
                        className="w-32 border border-neutral-200 rounded-lg pl-10 pr-2.5 py-2 focus:outline-none focus:border-[#BB4D00] bg-neutral-50 text-sm disabled:opacity-40 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                    <span>Final Price</span>
                    <div className="relative flex items-center">
                      <span className="absolute left-2.5 text-xs text-neutral-400 font-semibold">IDR</span>
                      <input
                        type="number"
                        min={0}
                        disabled={!totalTicket || totalTicket <= 0}
                        onWheel={(e) => e.currentTarget.blur()}
                        placeholder="0"
                        value={vipFinalPrice || ""}
                        onChange={(e) => setVipFinalPrice(Number(e.target.value))}
                        className="w-32 border border-neutral-200 rounded-lg pl-10 pr-2.5 py-2 focus:outline-none focus:border-[#BB4D00] bg-neutral-50 text-sm disabled:opacity-40 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. REGULAR TIER */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-center">
                  <label className="text-sm font-medium text-neutral-700 pl-4">Regular</label>
                  <div className="sm:col-span-2 flex flex-wrap gap-2.5 items-center text-xs text-neutral-500">
                    <input
                      type="number"
                      min={0}
                      max={regularQuota + remainingQuota}
                      disabled={!totalTicket || totalTicket <= 0}
                      onWheel={(e) => e.currentTarget.blur()}
                      placeholder="Quota"
                      value={regularQuota || ""}
                      onChange={(e) => setRegularQuota(Number(e.target.value))}
                      className="w-20 border border-neutral-200 rounded-lg px-2.5 py-2 focus:outline-none focus:border-[#BB4D00] bg-neutral-50 text-sm disabled:opacity-40 font-semibold text-neutral-900 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span>Normal Price</span>
                    <div className="relative flex items-center">
                      <span className="absolute left-2.5 text-xs text-neutral-400 font-semibold">IDR</span>
                      <input
                        type="number"
                        min={0}
                        disabled={!totalTicket || totalTicket <= 0}
                        onWheel={(e) => e.currentTarget.blur()}
                        placeholder="0"
                        value={regularPrice || ""}
                        onChange={(e) => setRegularPrice(Number(e.target.value))}
                        className="w-32 border border-neutral-200 rounded-lg pl-10 pr-2.5 py-2 focus:outline-none focus:border-[#BB4D00] bg-neutral-50 text-sm disabled:opacity-40 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                    <span>Final Price</span>
                    <div className="relative flex items-center">
                      <span className="absolute left-2.5 text-xs text-neutral-400 font-semibold">IDR</span>
                      <input
                        type="number"
                        min={0}
                        disabled={!totalTicket || totalTicket <= 0}
                        onWheel={(e) => e.currentTarget.blur()}
                        placeholder="0"
                        value={regularFinalPrice || ""}
                        onChange={(e) => setRegularFinalPrice(Number(e.target.value))}
                        className="w-32 border border-neutral-200 rounded-lg pl-10 pr-2.5 py-2 focus:outline-none focus:border-[#BB4D00] bg-neutral-50 text-sm disabled:opacity-40 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Presale Toggle */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-center">
                  <label className="text-sm font-medium text-neutral-700 pl-4">Presale Ticket</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={!totalTicket || totalTicket <= 0}
                      onClick={() => {
                        if (!totalTicket || totalTicket <= 0) {
                          setTierWarning(true);
                          return;
                        }
                        handleChange("presale", { ...form.presale, enabled: !form.presale?.enabled });
                      }}
                      className={`relative w-10 h-6 rounded-full transition-colors ${
                        !totalTicket || totalTicket <= 0 ? "opacity-50 cursor-not-allowed bg-neutral-200" : form.presale?.enabled ? "bg-[#EA580C] cursor-pointer" : "bg-neutral-200 cursor-pointer"
                      }`}
                    >
                      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${
                        form.presale?.enabled ? "left-4.5" : "left-0.5"
                      }`} />
                    </button>
                    <span className="text-xs text-neutral-500 font-medium">
                      {form.presale?.enabled ? "Aktif" : "Tidak Aktif"}
                    </span>
                  </div>
                </div>

                {/* Presale Form */}
                {form.presale?.enabled && (
                  <div className="ml-4 space-y-4 p-4 bg-orange-50/40 border border-orange-200 rounded-xl">
                    <div className="grid grid-cols-3 gap-4 items-center">
                      <label className="text-xs font-semibold text-neutral-700">Presale Quota</label>
                      <input
                        type="number"
                        min={0}
                        max={presaleQuota + remainingQuota}
                        disabled={!totalTicket || totalTicket <= 0}
                        onWheel={(e) => e.currentTarget.blur()}
                        placeholder="Quota"
                        value={presaleQuota || ""}
                        onChange={(e) => setPresaleQuota(Number(e.target.value))}
                        className="w-24 border border-neutral-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#BB4D00] bg-white font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4 items-center">
                      <label className="text-xs font-semibold text-neutral-700">Presale Period</label>
                      <div className="col-span-2 flex items-center gap-2 text-xs text-neutral-500">
                        <input
                          type="date"
                          value={form.presale?.startDate}
                          onChange={(e) => handleChange("presale", { ...form.presale, startDate: e.target.value })}
                          className="border border-neutral-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-[#BB4D00] bg-white"
                        />
                        <span>until</span>
                        <input
                          type="date"
                          value={form.presale?.endDate}
                          onChange={(e) => handleChange("presale", { ...form.presale, endDate: e.target.value })}
                          className="border border-neutral-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-[#BB4D00] bg-white"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Thumbnail Image */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-start">
                <label className="text-sm font-medium text-neutral-700">Thumbnail Image</label>
                <div className="sm:col-span-2">
                  <input
                    type="file"
                    accept="image/*"
                    className="text-sm text-neutral-600 file:mr-3 file:py-1.5 file:px-4 file:rounded-lg file:border file:border-neutral-200 file:text-xs file:font-semibold file:bg-neutral-50 file:text-neutral-700 hover:file:bg-neutral-100 file:cursor-pointer cursor-pointer"
                  />
                  <p className="text-xs text-neutral-400 mt-1">1:1 Aspect Ratio</p>
                </div>
              </div>

              {/* Cover Images */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-start">
                <label className="text-sm font-medium text-neutral-700">Images Cover</label>
                <div className="sm:col-span-2">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="text-sm text-neutral-600 file:mr-3 file:py-1.5 file:px-4 file:rounded-lg file:border file:border-neutral-200 file:text-xs file:font-semibold file:bg-neutral-50 file:text-neutral-700 hover:file:bg-neutral-100 file:cursor-pointer cursor-pointer"
                  />
                  <p className="text-xs text-neutral-400 mt-1">2:1 Aspect Ratio</p>
                </div>
              </div>

            </div>

            {/* Bottom Action Bar */}
            <div className="border-t border-neutral-100 bg-neutral-50/50 px-6 md:px-8 py-5">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      id="terms"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="rounded cursor-pointer"
                    />
                    <label htmlFor="terms" className="text-xs text-neutral-600 cursor-pointer">
                      I agree with{" "}
                      <span className="text-[#BB4D00] underline font-medium">terms & conditions</span>
                    </label>
                  </div>
                </div>

                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    className="px-5 py-2.5 rounded-full text-sm font-semibold text-neutral-700 border border-neutral-200 hover:bg-neutral-100 transition-colors cursor-pointer"
                  >
                    Draft
                  </button>
                  <button
                    type="button"
                    onClick={handlePublish}
                    className="px-6 py-2.5 rounded-full text-sm font-semibold text-white bg-[#EA580C] hover:bg-[#BB4D00] transition-colors cursor-pointer shadow-xs"
                  >
                    Publish
                  </button>
                </div>

              </div>
            </div>

          </div>
        </div>
        </div>
      </div>
      <Footer/>
    </div>
  );
}