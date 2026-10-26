"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Sidebar from "@/components/sidebar/SidebarDashboard";
import {
  QrCodeIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  XCircleIcon,
  UserIcon,
  TicketIcon,
  ClockIcon,
  ChevronDownIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import Footer from "@/components/menubar/footer";
import NavbarOrganizer from "@/components/menubar/navbarOrganizer";

interface ScannedTicket {
  id?: string;
  ticketCode: string;
  eventId?: string;
  eventName: string;
  customerName: string;
  email: string;
  ticketTier: string;
  status: "REGISTERED" | "ATTENDED";
  checkedInAt?: string | null;
}

interface EventOption {
  id: string;
  title: string;
}

function TicketScannerContent() {
  const searchParams = useSearchParams();
  const initialEventId = searchParams.get("eventId") || "ALL";

  const [eventsList, setEventsList] = useState<EventOption[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>(initialEventId);
  const [inputCode, setInputCode] = useState<string>("");
  const [isScanning, setIsScanning] = useState<boolean>(false);

  const [scanResult, setScanResult] = useState<{
    status: "IDLE" | "SUCCESS" | "ALREADY_USED" | "INVALID";
    ticket?: ScannedTicket;
    message?: string;
  }>({ status: "IDLE" });

  const [recentScans, setRecentScans] = useState<ScannedTicket[]>([]);

  const formatTimeWIB = (isoString?: string | null) => {
    if (!isoString) return "-";
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return (
      new Intl.DateTimeFormat("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "short",
      })
        .format(d)
        .replace(".", ":") + " WIB"
    );
  };

  // Muat daftar Event & riwayat Check-In terakhir dari Database
  useEffect(() => {
    const loadInitialScannerData = async () => {
      try {
        const [resEvents, resAttendees] = await Promise.all([
          fetch("/api/organizer/events"),
          fetch("/api/organizer/attendees"),
        ]);

        const jsonEvents = await resEvents.json();
        if (jsonEvents.success && Array.isArray(jsonEvents.data)) {
          setEventsList(
            jsonEvents.data.map((ev: any) => ({
              id: String(ev.id),
              title: String(ev.title),
            }))
          );
        }

        const jsonAttendees = await resAttendees.json();
        if (jsonAttendees.success && Array.isArray(jsonAttendees.data)) {
          const alreadyAttended: ScannedTicket[] = jsonAttendees.data
            .filter((a: any) => a.status === "ATTENDED")
            .slice(0, 5)
            .map((a: any) => ({
              id: a.id,
              ticketCode: a.ticketCode,
              eventId: a.eventId,
              eventName: a.eventName,
              customerName: a.customerName,
              email: a.email,
              ticketTier: a.ticketTier,
              status: "ATTENDED",
              checkedInAt: a.checkInTime,
            }));
          setRecentScans(alreadyAttended);
        }
      } catch (err) {
        console.error("Gagal memuat data scanner:", err);
      }
    };

    loadInitialScannerData();
  }, []);

  // Proses Verifikasi Kode Tiket langsung ke Database Backend Express
  const processScan = async (codeToVerify: string) => {
    const cleanCode = codeToVerify.trim();
    if (!cleanCode) return;

    try {
      setIsScanning(true);
      const res = await fetch("/api/organizer/attendees/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketCode: cleanCode,
          eventId: selectedEvent,
        }),
      });

      const json = await res.json();
      const scanData = json.data;

      if (!scanData) {
        setScanResult({
          status: "INVALID",
          message: json.message || "Gagal memverifikasi tiket.",
        });
        return;
      }

      if (scanData.scanStatus === "INVALID") {
        setScanResult({
          status: "INVALID",
          message: scanData.message,
        });
        return;
      }

      if (scanData.scanStatus === "ALREADY_USED") {
        setScanResult({
          status: "ALREADY_USED",
          ticket: scanData.ticket,
          message: scanData.message,
        });
        return;
      }

      if (scanData.scanStatus === "SUCCESS" && scanData.ticket) {
        const verifiedTicket: ScannedTicket = scanData.ticket;
        setScanResult({
          status: "SUCCESS",
          ticket: verifiedTicket,
          message: scanData.message,
        });

        setRecentScans((prev) => [
          verifiedTicket,
          ...prev.filter((item) => item.ticketCode !== verifiedTicket.ticketCode).slice(0, 4),
        ]);
        setInputCode("");
      }
    } catch (error) {
      console.error("Error saat scan tiket:", error);
      setScanResult({
        status: "INVALID",
        message: "Terjadi gangguan koneksi ke server saat memeriksa tiket.",
      });
    } finally {
      setIsScanning(false);
    }
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
            {/* Header & Pemilih Gate Event */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-6 border-b border-neutral-100">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <Link
                    href="/organizer/dashboard/attendees"
                    className="h-8 w-8 rounded-lg border border-neutral-200 flex items-center justify-center text-neutral-600 hover:bg-neutral-50 transition-colors"
                    title="Back to Attendee List"
                  >
                    <ArrowLeftIcon className="w-4 h-4" />
                  </Link>
                  <h1 className="text-xl md:text-2xl font-bold text-neutral-900 flex items-center gap-2">
                    <QrCodeIcon className="w-6 h-6 text-[#EA580C]" />
                    <span>Organizer Check-In Scanner</span>
                  </h1>
                </div>
                <p className="text-xs md:text-sm text-neutral-500">
                  Verify ticket codes at the entrance gate and sync attendance status in real time.
                </p>
              </div>

              {/* Pilihan Gate Event dari Database */}
              <div className="relative w-full sm:w-auto">
                <select
                  value={selectedEvent}
                  onChange={(e) => {
                    setSelectedEvent(e.target.value);
                    setScanResult({ status: "IDLE" });
                  }}
                  className="w-full sm:w-72 h-10 appearance-none bg-neutral-50 border border-neutral-200 text-neutral-800 text-xs md:text-sm font-semibold pl-4 pr-9 rounded-xl focus:outline-none focus:border-[#BB4D00] cursor-pointer truncate"
                >
                  <option value="ALL">All Organizer Events</option>
                  {eventsList.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className="w-4 h-4 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Layout Grid 2 Kolom: Kiri Kamera & Input, Kanan Hasil Verifikasi */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* KOLOM KIRI (7/12): Viewfinder Kamera Scanner */}
              <div className="lg:col-span-7 space-y-4">
                <div className="relative aspect-4/3 w-full bg-neutral-900 rounded-2xl overflow-hidden flex flex-col items-center justify-center p-6 text-center border-4 border-neutral-800 shadow-inner">
                  <div className="absolute inset-x-8 top-12 bottom-12 border-2 border-white/20 rounded-xl pointer-events-none flex flex-col justify-between p-2">
                    <div className="w-full h-0.5 bg-[#EA580C] shadow-[0_0_12px_#EA580C] animate-pulse" />
                    <div className="flex justify-between items-center text-[10px] text-white/40 font-mono">
                      <span>GATE VERIFICATION ACTIVE</span>
                      <span>OPTICAL / CODE READY</span>
                    </div>
                  </div>

                  <QrCodeIcon className="w-20 h-20 text-white/10 mb-2 animate-pulse" />
                  <p className="text-white font-semibold text-sm">
                    Position Ticket QR Code Inside the Frame
                  </p>
                  <p className="text-white/40 text-xs mt-1 max-w-xs">
                    Or use a barcode scanner / manual ticket code input below
                  </p>
                </div>

                {/* Form Input Kode Tiket */}
                <form onSubmit={handleManualSubmit} className="flex gap-2.5">
                  <input
                    type="text"
                    placeholder="Enter ticket code or QR token (e.g. CHX-1234-ABCD)"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value)}
                    disabled={isScanning}
                    className="flex-1 h-11 px-4 text-xs md:text-sm border border-neutral-200 rounded-xl bg-neutral-50 focus:bg-white focus:outline-none focus:border-[#BB4D00] font-mono"
                  />
                  <button
                    type="submit"
                    disabled={isScanning || !inputCode.trim()}
                    className="h-11 px-6 rounded-xl text-xs md:text-sm font-semibold text-white bg-[#EA580C] hover:bg-[#BB4D00] disabled:opacity-50 transition-colors cursor-pointer shadow-xs whitespace-nowrap"
                  >
                    {isScanning ? "Verifying..." : "Check In"}
                  </button>
                </form>
              </div>

              {/* KOLOM KANAN (5/12): Kartu Hasil Scan & Riwayat Check-In */}
              <div className="lg:col-span-5 space-y-5">
                {/* 1. KARTU HASIL VERIFIKASI */}
                <div className="bg-[#FAF8F4] rounded-2xl p-5 border border-[#E6DED0] min-h-64 flex flex-col justify-center">
                  {/* IDLE */}
                  {scanResult.status === "IDLE" && (
                    <div className="text-center py-8 text-neutral-400">
                      <QrCodeIcon className="w-12 h-12 mx-auto text-neutral-300 mb-2" />
                      <p className="font-semibold text-sm text-neutral-700">
                        Ready to Verify Ticket
                      </p>
                      <p className="text-xs text-neutral-500 mt-1">
                        Scan a QR code or type the ticket code to validate attendee entry.
                      </p>
                    </div>
                  )}

                  {/* SUCCESS */}
                  {scanResult.status === "SUCCESS" && scanResult.ticket && (
                    <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                      <div className="flex items-center gap-2.5 text-emerald-700">
                        <CheckCircleIcon className="w-7 h-7 shrink-0" />
                        <div>
                          <h3 className="font-bold text-base leading-tight">
                            CHECK-IN SUCCESSFUL
                          </h3>
                          <p className="text-xs text-emerald-600 mt-0.5">
                            {scanResult.message}
                          </p>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl p-4 border border-emerald-200 space-y-2 text-xs">
                        <div className="flex items-center gap-2 text-neutral-900">
                          <UserIcon className="w-4 h-4 text-neutral-400" />
                          <span className="font-bold text-sm">
                            {scanResult.ticket.customerName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-neutral-600">
                          <TicketIcon className="w-4 h-4 text-neutral-400" />
                          <span>
                            Event: <strong>{scanResult.ticket.eventName}</strong> ({scanResult.ticket.ticketTier})
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-neutral-600 font-mono">
                          <span className="text-[11px] bg-neutral-100 border border-neutral-200 px-2 py-0.5 rounded font-bold">
                            {scanResult.ticket.ticketCode}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-emerald-700 pt-1 font-semibold">
                          <ClockIcon className="w-4 h-4" />
                          <span>Checked in at: {formatTimeWIB(scanResult.ticket.checkedInAt)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ALREADY USED */}
                  {scanResult.status === "ALREADY_USED" && scanResult.ticket && (
                    <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                      <div className="flex items-center gap-2.5 text-amber-700">
                        <ExclamationCircleIcon className="w-7 h-7 shrink-0" />
                        <div>
                          <h3 className="font-bold text-base leading-tight">
                            TICKET ALREADY SCANNED
                          </h3>
                          <p className="text-xs text-amber-600 mt-0.5">
                            {scanResult.message}
                          </p>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl p-4 border border-amber-200 text-xs space-y-1.5 text-neutral-700">
                        <p>
                          Holder: <strong>{scanResult.ticket.customerName}</strong> ({scanResult.ticket.email})
                        </p>
                        <p>
                          Tier: <strong>{scanResult.ticket.ticketTier}</strong> · Code:{" "}
                          <span className="font-mono font-bold">{scanResult.ticket.ticketCode}</span>
                        </p>
                        <p>
                          First Scanned: <strong>{formatTimeWIB(scanResult.ticket.checkedInAt)}</strong>
                        </p>
                        <p className="text-rose-600 font-semibold pt-1 border-t border-neutral-100">
                          Entry denied. Duplicate check-in is not permitted.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* INVALID */}
                  {scanResult.status === "INVALID" && (
                    <div className="text-center py-6 space-y-2 animate-in fade-in duration-200">
                      <XCircleIcon className="w-12 h-12 mx-auto text-rose-500" />
                      <h3 className="font-bold text-base text-rose-600">
                        INVALID TICKET
                      </h3>
                      <p className="text-xs text-neutral-600 max-w-xs mx-auto">
                        {scanResult.message}
                      </p>
                    </div>
                  )}
                </div>

                {/* 2. RECENT LIVE CHECK-IN FEED */}
                <div className="border border-neutral-200 rounded-2xl p-4 bg-white space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                      Recent Gate Check-Ins
                    </h4>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-[11px] text-emerald-700 font-semibold">
                        Synced with DB
                      </span>
                    </div>
                  </div>

                  {recentScans.length === 0 ? (
                    <p className="text-xs text-neutral-400 py-4 text-center">
                      No tickets have been scanned yet.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {recentScans.map((item) => (
                        <div
                          key={item.ticketCode}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF8F4] border border-neutral-200/60 text-xs"
                        >
                          <div>
                            <p className="font-bold text-neutral-800">
                              {item.customerName}
                            </p>
                            <p className="text-[11px] text-neutral-500 font-mono">
                              {item.ticketTier} · {item.ticketCode}
                            </p>
                          </div>
                          <span className="text-[11px] font-semibold text-emerald-700 whitespace-nowrap">
                            {formatTimeWIB(item.checkedInAt)}
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

export default function TicketScannerPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAF8F4] p-8 text-center text-sm text-neutral-500">Loading scanner...</div>}>
      <TicketScannerContent />
    </Suspense>
  );
}
