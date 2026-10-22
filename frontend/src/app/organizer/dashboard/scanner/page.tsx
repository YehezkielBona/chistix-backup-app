"use client";
import React, { useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/sidebar/SidebarDashboard";
import { QrCodeIcon, CheckCircleIcon, ExclamationCircleIcon, XCircleIcon, UserIcon, TicketIcon, ClockIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import Footer from "@/components/menubar/footer";
import NavbarOrganizer from "@/components/menubar/navbarOrganizer";

interface ScannedTicket {
  ticketCode: string;
  eventName: string;
  customerName: string;
  email: string;
  ticketTier: string;
  status: "REGISTERED" | "ATTENDED";
  checkedInAt?: string;
}

const INITIAL_TICKETS: ScannedTicket[] = [
  {
    ticketCode: "CHX-RES-001",
    eventName: "Resonance Soundfest 2026: Intimate Live Performance",
    customerName: "Budi Santoso",
    email: "budi@email.com",
    ticketTier: "Presale Regular",
    status: "REGISTERED",
  },
  {
    ticketCode: "CHX-RES-002",
    eventName: "Resonance Soundfest 2026: Intimate Live Performance",
    customerName: "Siti Aminah",
    email: "siti@email.com",
    ticketTier: "Normal Regular",
    status: "ATTENDED",
    checkedInAt: "18:42 WIB",
  },
  {
    ticketCode: "CHX-RES-003",
    eventName: "Resonance Soundfest 2026: Intimate Live Performance",
    customerName: "Rani Putri",
    email: "rani@email.com",
    ticketTier: "Presale VIP",
    status: "REGISTERED",
  },
  {
    ticketCode: "CHX-SYM-001",
    eventName: "Night Symphony: Classic Meets Rock",
    customerName: "Michael Tan",
    email: "michael@email.com",
    ticketTier: "VIP Gold",
    status: "REGISTERED",
  },
];

export default function TicketScannerPage() {
  const [tickets, setTickets] = useState<ScannedTicket[]>(INITIAL_TICKETS);
  const [selectedEvent, setSelectedEvent] = useState("Resonance Soundfest 2026: Intimate Live Performance");
  const [inputCode, setInputCode] = useState("");

  const [scanResult, setScanResult] = useState<{
    status: "IDLE" | "SUCCESS" | "ALREADY_USED" | "INVALID";
    ticket?: ScannedTicket;
    message?: string;
  }>({ status: "IDLE" });

  const [recentScans, setRecentScans] = useState<ScannedTicket[]>([]);

  const processScan = (codeToVerify: string) => {
    const cleanCode = codeToVerify.trim().toUpperCase();
    if (!cleanCode) return;

    const foundTicket = tickets.find((t) => t.ticketCode === cleanCode);
    if (!foundTicket) {
      setScanResult({
        status: "INVALID",
        message: `Ticket with ${cleanCode} doesn't exist in List Ticket`,
      });
      return;
    }

    if (foundTicket.eventName !== selectedEvent) {
      setScanResult({
        status: "INVALID",
        message: `This ticket valid but its not for event ${selectedEvent}. Its for ${foundTicket.eventName} event.`,
      });
    }

    if (foundTicket.status === "ATTENDED") {
      setScanResult({
        status: "ALREADY_USED",
        ticket: foundTicket,
        message: `This ticket already used at ${foundTicket.checkedInAt}! Becareful Duplicated Ticket`,
      });
    }

    const currentTime =
      new Date().toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      }) + "WIB";

    const updatedTicket: ScannedTicket = {
      ...foundTicket,
      status: "ATTENDED",
      checkedInAt: currentTime,
    };

    setTickets((prev) => prev.map((t) => (t.ticketCode === cleanCode ? updatedTicket : t)));

    setRecentScans((prev) => [updatedTicket, ...prev.slice(0, 4)]);

    setScanResult({
      status: "SUCCESS",
      ticket: updatedTicket,
      message: "Check-In Success! Access Granted ",
    });

    setInputCode;
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    processScan(inputCode);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F4] text-neutral-800 font-sans flex flex-col justify-between">
        <NavbarOrganizer />
        <div className="flex-1 w-full p-4 md:p-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-6 items-start">

        <Sidebar />

        <main className="flex-1 w-full bg-white rounded-2xl p-6 md:p-8 shadow-xs border border-neutral-100">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-6 border-b border-neutral-100">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-neutral-900 flex items-center gap-2">
                <QrCodeIcon className="w-6 h-6 text-[#EA580C]" />
                <span>Organizer Check-In Scanner</span>
              </h1>
              <p className="text-xs text-neutral-400 mt-0.5">
                Scan QR code tiket peserta di gate masuk untuk verifikasi kehadiran
              </p>
            </div>

            {/* Pilihan Gate Event */}
            <div className="relative w-full sm:w-auto">
              <select
                value={selectedEvent}
                onChange={(e) => {
                  setSelectedEvent(e.target.value);
                  setScanResult({ status: "IDLE" });
                }}
                className="w-full sm:w-80 appearance-none bg-neutral-50 border border-neutral-200 text-neutral-800 text-xs md:text-sm font-semibold py-2 pl-4 pr-9 rounded-full focus:outline-none focus:border-[#BB4D00] cursor-pointer"
              >
                <option value="Resonance Soundfest 2026: Intimate Live Performance">
                  Resonance Soundfest 2026: Intimate Live Performance
                </option>
                <option value="Night Symphony: Classic Meets Rock">
                  Night Symphony: Classic Meets Rock
                </option>
              </select>
              <ChevronDownIcon className="w-4 h-4 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Layout Grid 2 Kolom: Kiri Kamera, Kanan Hasil Scan */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* KOLOM KIRI (7/12): Viewfinder Kamera Scanner */}
            <div className="lg:col-span-7 space-y-4">
              
              {/* Frame Kamera dengan Garis Laser Oranye */}
              <div className="relative aspect-4/3 w-full bg-neutral-900 rounded-2xl overflow-hidden flex flex-col items-center justify-center p-6 text-center border-4 border-neutral-800 shadow-inner">
                <div className="absolute inset-x-8 top-12 bottom-12 border-2 border-white/20 rounded-xl pointer-events-none flex flex-col justify-between p-2">
                  <div className="w-full h-0.5 bg-[#EA580C] shadow-[0_0_12px_#EA580C] animate-pulse" />
                  <div className="flex justify-between items-center text-[10px] text-white/40 font-mono">
                    <span>GATE 1 ACTIVE</span>
                    <span>1080p CAMERA READY</span>
                  </div>
                </div>

                <QrCodeIcon className="w-20 h-20 text-white/10 mb-2 animate-pulse" />
                <p className="text-white font-semibold text-sm">
                  Arahkan QR Code Tiket ke Kamera
                </p>
                <p className="text-white/40 text-xs mt-1 max-w-xs">
                  Sensor optik akan membaca kode unik tiket secara otomatis
                </p>
              </div>

              {/* Input Manual / Barcode Gun */}
              <form onSubmit={handleManualSubmit} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Atau input / scan barcode tiket (contoh: CHX-RES-001)"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  className="flex-1 px-4 py-2.5 text-xs md:text-sm border border-neutral-200 rounded-xl bg-neutral-50 focus:outline-none focus:border-[#BB4D00] font-mono"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs md:text-sm font-semibold text-white bg-[#EA580C] hover:bg-[#BB4D00] transition-colors cursor-pointer shadow-xs whitespace-nowrap"
                >
                  Check In
                </button>
              </form>

            </div>

            {/* KOLOM KANAN (5/12): Kartu Hasil Scan & Riwayat Check-In */}
            <div className="lg:col-span-5 space-y-5">
              
              {/* 1. KARTU HASIL VERIFIKASI */}
              <div className="bg-neutral-50 rounded-2xl p-5 border border-neutral-100 min-h-64 flex flex-col justify-center">
                
                {/* IDLE */}
                {scanResult.status === "IDLE" && (
                  <div className="text-center py-8 text-neutral-400">
                    <QrCodeIcon className="w-12 h-12 mx-auto text-neutral-300 mb-2" />
                    <p className="font-semibold text-sm text-neutral-600">
                      Menunggu Pemindaian
                    </p>
                    <p className="text-xs mt-0.5">
                      Scan QR peserta untuk melihat status keabsahan tiket
                    </p>
                  </div>
                )}

                {/* SUCCESS */}
                {scanResult.status === "SUCCESS" && scanResult.ticket && (
                  <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center gap-2.5 text-emerald-600">
                      <CheckCircleIcon className="w-7 h-7 shrink-0" />
                      <div>
                        <h3 className="font-bold text-base leading-tight">
                          CHECK-IN BERHASIL!
                        </h3>
                        <p className="text-xs text-emerald-700">
                          {scanResult.message}
                        </p>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl p-4 border border-emerald-100 space-y-2 text-xs">
                      <div className="flex items-center gap-2 text-neutral-800">
                        <UserIcon className="w-4 h-4 text-neutral-400" />
                        <span className="font-bold text-sm">
                          {scanResult.ticket.customerName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-neutral-600">
                        <TicketIcon className="w-4 h-4 text-neutral-400" />
                        <span>
                          Tier: <strong>{scanResult.ticket.ticketTier}</strong>
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-neutral-600 font-mono">
                        <span className="text-[10px] bg-neutral-100 px-2 py-0.5 rounded">
                          {scanResult.ticket.ticketCode}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-emerald-700 pt-1 font-semibold">
                        <ClockIcon className="w-4 h-4" />
                        <span>Waktu: {scanResult.ticket.checkedInAt}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* ALREADY USED */}
                {scanResult.status === "ALREADY_USED" && scanResult.ticket && (
                  <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center gap-2.5 text-amber-600">
                      <ExclamationCircleIcon className="w-7 h-7 shrink-0" />
                      <div>
                        <h3 className="font-bold text-base leading-tight">
                          TIKET SUDAH DIGUNAKAN!
                        </h3>
                        <p className="text-xs text-amber-700">
                          {scanResult.message}
                        </p>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl p-4 border border-amber-200 text-xs space-y-1.5 text-neutral-700">
                      <p>Pemilik: <strong>{scanResult.ticket.customerName}</strong></p>
                      <p>Kategori: {scanResult.ticket.ticketTier}</p>
                      <p className="text-rose-600 font-semibold pt-1">
                        ⚠️ Akses ditolak! Dilarang mengizinkan masuk ganda.
                      </p>
                    </div>
                  </div>
                )}

                {/* INVALID */}
                {scanResult.status === "INVALID" && (
                  <div className="text-center py-6 space-y-2 animate-in fade-in duration-200">
                    <XCircleIcon className="w-12 h-12 mx-auto text-red-500" />
                    <h3 className="font-bold text-base text-red-600">
                      TIKET TIDAK VALID
                    </h3>
                    <p className="text-xs text-neutral-600 max-w-xs mx-auto">
                      {scanResult.message}
                    </p>
                  </div>
                )}

              </div>

              {/* 2. RECENT LIVE CHECK-IN FEED */}
              <div className="border border-neutral-100 rounded-2xl p-4 bg-white space-y-3">
                <h4 className="text-xs font-bold text-neutral-700 uppercase tracking-wider flex items-center justify-between">
                  <span>Live Check-in Feed</span>
                  <span className="text-[10px] text-emerald-600 font-semibold">
                    ● Active
                  </span>
                </h4>

                {recentScans.length === 0 ? (
                  <p className="text-xs text-neutral-400 py-3 text-center">
                    Belum ada peserta yang check-in pada sesi ini.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {recentScans.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-50 text-xs"
                      >
                        <div>
                          <p className="font-bold text-neutral-800">
                            {item.customerName}
                          </p>
                          <p className="text-[11px] text-neutral-400 font-mono">
                            {item.ticketTier} · {item.ticketCode}
                          </p>
                        </div>
                        <span className="text-[11px] font-semibold text-emerald-600">
                          {item.checkedInAt}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>

        </main>
        </div>
      </div>
      <Footer />
    </div>
  );
}
