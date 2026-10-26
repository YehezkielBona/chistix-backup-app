"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, Clock } from "lucide-react";
import jsPDF from "jspdf";
// [LAMA] import html2canvas from "html2canvas";
import html2canvas from "html2canvas-pro"; // [BARU] paket yang terdaftar di package.json
import { QRCodeCanvas } from "qrcode.react"; // [BARU] QR dibuat lokal, tanpa layanan luar
import { apiFetch } from "@/lib/api"; // [BARU]
import { authClient } from "@/lib/auth-client"; // [BARU] nama customer di tiket
// [LAMA] import type { ApiTransaction, Paged } from "@/types/api"; // [BARU]
import { TICKET_LABEL, type ApiTransaction, type Paged } from "@/types/api"; // [BARU] + TICKET_LABEL

interface TicketItem {
  id: string;
  eventName: string;
  ticketType: string;
  qty: number;
  dateTime: string;
  location: string;
  customerName?: string;
  totalAmount?: number;
  status?: "Done" | "Waiting Approval";
  eTickets: { ticketCode: string; qrToken: string; isAttended: boolean }[]; // [BARU] tiket asli
}

// [BARU] ubah transaksi dari backend menjadi baris tabel
function toTicketItem(trx: ApiTransaction, customerName?: string): TicketItem {
  return {
    id: trx.id,
    eventName: trx.event.title,
    // [LAMA] ticketType: trx.ticketType ?? "E-Ticket", // TODO schema v2: trx.ticketType selalu terisi
    ticketType: TICKET_LABEL[trx.ticketType] ?? "E-Ticket", // [BARU]
    qty: trx.quantity,
    dateTime: new Date(trx.event.startDate).toLocaleString("id-ID", {
      day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta",
    }),
    location: `${trx.event.venueDetail}, ${trx.event.cityName}`,
    customerName,
    totalAmount: trx.totalPrice,
    status: "Done",
    eTickets: trx.eTickets.map((t) => ({ ticketCode: t.ticketCode, qrToken: t.qrToken, isAttended: t.isAttended })),
  };
}

export default function EventsTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const [activeDownloadId, setActiveDownloadId] = useState<string | null>(null);
  const { data: session } = authClient.useSession(); // [BARU]

  const pdfContainerRef = useRef<HTMLDivElement>(null);
  const [pdfTicketsData, setPdfTicketsData] = useState<{
    item: TicketItem;
    // [LAMA] tickets: { id: string }[];
    tickets: { id: string; qr: string }[]; // [BARU] id = ticketCode, qr = qrToken
  } | null>(null);

  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true); // [BARU]
  const [error, setError] = useState(""); // [BARU]

  useEffect(() => {
    // [LAMA] data dummy
    // localStorage.removeItem("chistix_my_tickets");
    //
    // const approvedTickets: TicketItem[] = [
    //   {
    //     id: "TIX-8891",
    //     eventName: "Night Symphony: Classic Meets Rock",
    //     ticketType: "Presale",
    //     qty: 3,
    //     dateTime: "19 Desember 2026 pukul 19:00",
    //     location: "North Jakarta, Jakarta",
    //     customerName: "mutiara",
    //     totalAmount: 166500,
    //     status: "Done",
    //   },
    // ];
    //
    // setTickets(approvedTickets);

    // [BARU] hanya transaksi DONE (sudah disetujui organizer) yang punya e-ticket
    apiFetch<Paged<ApiTransaction>>("/api/transactions?status=DONE&limit=50")
      .then((r) => setTickets(r.data.map((trx) => toTicketItem(trx, session?.user?.name))))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [session?.user?.name]);

  const filteredTickets = tickets.filter(
    (item) =>
      item.eventName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.ticketType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatRupiah = (num: number) => "Rp " + num.toLocaleString("id-ID");

  const handlePrintTicket = async (item: TicketItem) => {
    setActiveDownloadId(item.id);
    setIsDownloading(true);

    // [LAMA] id tiket dibuat acak di browser
    // const generatedTickets = Array.from({ length: item.qty }, () => ({
    //   id: Math.random().toString(36).substring(2, 10).toUpperCase(),
    // }));
    // [BARU] tiket asli dari database: 1 tiket = 1 halaman PDF = 1 QR unik
    const generatedTickets = item.eTickets.map((t) => ({ id: t.ticketCode, qr: t.qrToken }));

    setPdfTicketsData({
      item,
      tickets: generatedTickets,
    });

    setTimeout(async () => {
      if (!pdfContainerRef.current) {
        setIsDownloading(false);
        setActiveDownloadId(null);
        return;
      }

      try {
        const pdf = new jsPDF("p", "mm", "a4");
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        const ticketCards =
          pdfContainerRef.current.querySelectorAll<HTMLElement>(".pdf-ticket-page");

        for (let i = 0; i < ticketCards.length; i++) {
          const card = ticketCards[i];

          const canvas = await html2canvas(card, {
            scale: 2,
            useCORS: true,
            backgroundColor: "#ffffff",
            ignoreElements: (el) => el.tagName === "STYLE" || el.tagName === "LINK",
          });

          const imgData = canvas.toDataURL("image/png");

          const imgWidth = pdfWidth - 40;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          const xPos = (pdfWidth - imgWidth) / 2;
          const yPos = (pdfHeight - imgHeight) / 2;

          if (i > 0) {
            pdf.addPage();
          }

          pdf.addImage(imgData, "PNG", xPos, yPos, imgWidth, imgHeight);
        }

        pdf.save(`E-Ticket-${item.eventName.replace(/\s+/g, "_")}.pdf`);
      } catch (error) {
        console.error("Gagal mencetak PDF:", error);
      } finally {
        setIsDownloading(false);
        setActiveDownloadId(null);
        setPdfTicketsData(null);
      }
    }, 300);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Events</h1>
        <p className="mt-0.5 text-xs text-neutral-500">
          Daftar tiket resmi yang sudah disetujui organizer dan siap dicetak.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search event name, location, or ticket type..."
            className="w-full rounded-2xl border border-neutral-200 bg-white pl-9 pr-4 py-2.5 text-xs text-neutral-800 placeholder-neutral-400 focus:border-amber-500 focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* [BARU] pesan error */}
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}

      <div className="w-full">
        <table className="w-full text-left text-xs table-fixed">
          <thead className="border-b border-neutral-100 text-neutral-400">
            <tr>
              <th className="pb-3 font-medium text-left w-1/4">Event Name</th>
              <th className="pb-3 font-medium text-center px-2">Ticket Type</th>
              <th className="pb-3 font-medium text-center px-2">Jumlah</th>
              <th className="pb-3 font-medium text-center px-2">Date & Time</th>
              <th className="pb-3 font-medium text-center px-2">Location</th>
              <th className="pb-3 font-medium text-center px-2">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-50 text-neutral-700">
            {/* [BARU] loading state */}
            {loading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-neutral-400">Memuat tiket...</td>
              </tr>
            ) : filteredTickets.length > 0 ? (
              filteredTickets.map((ticket) => (
                <tr key={ticket.id}>
                  <td className="py-4 font-semibold text-neutral-900 pr-2 break-words text-left">
                    {ticket.eventName}
                  </td>
                  <td className="py-4 text-center px-2">
                    <span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-100 text-amber-800">
                      {ticket.ticketType}
                    </span>
                  </td>
                  <td className="py-4 text-center px-2 font-medium text-neutral-800">
                    {ticket.qty}x Ticket
                  </td>
                  <td className="py-4 text-center px-2 text-neutral-600 break-words">
                    {ticket.dateTime}
                  </td>
                  <td className="py-4 text-center px-2 text-neutral-600 break-words">
                    {ticket.location}
                  </td>
                  <td className="py-4 text-center px-2">
                    <button
                      type="button"
                      // [LAMA] disabled={isDownloading && activeDownloadId === ticket.id}
                      disabled={(isDownloading && activeDownloadId === ticket.id) || ticket.eTickets.length === 0}
                      onClick={() => handlePrintTicket(ticket)}
                      className="rounded-lg bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 px-3 py-1.5 text-xs font-semibold text-white transition-colors cursor-pointer active:scale-95 disabled:cursor-not-allowed inline-block"
                    >
                      {isDownloading && activeDownloadId === ticket.id
                        ? "Generating..."
                        : "Cetak Tiket"}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-12 text-center text-neutral-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Clock className="w-8 h-8 text-neutral-300 stroke-[1.5]" />
                    <p className="font-semibold text-neutral-600">Belum ada tiket aktif</p>
                    <p className="text-[11px]">
                      Tiket akan muncul di sini setelah pembayaran disetujui oleh organizer.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* TEMPLATE PDF TERSEMBUNYI */}
      {pdfTicketsData && (
        <div style={{ position: "absolute", left: "-9999px", top: "-9999px" }}>
          <div
            ref={pdfContainerRef}
            style={{ display: "flex", flexDirection: "column", gap: "40px" }}
          >
            {pdfTicketsData.tickets.map((t) => (
              <div
                key={t.id}
                className="pdf-ticket-page"
                style={{
                  width: "420px",
                  backgroundColor: "#ffffff",
                  border: "2px solid #1e293b",
                  borderRadius: "20px",
                  padding: "32px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  color: "#0f172a",
                  fontFamily: "Arial, sans-serif",
                  boxSizing: "border-box",
                }}
              >
                <div style={{ textAlign: "center", marginBottom: "24px", width: "100%" }}>
                  <h1
                    style={{
                      fontSize: "24px",
                      fontWeight: "800",
                      letterSpacing: "1px",
                      margin: "0 0 8px 0",
                      color: "#000000",
                    }}
                  >
                    E-TICKET
                  </h1>
                  <h2
                    style={{
                      fontSize: "16px",
                      fontWeight: "700",
                      margin: "0 0 6px 0",
                      color: "#000000",
                    }}
                  >
                    The bill has been paid
                  </h2>
                  <p style={{ fontSize: "11px", color: "#475569", margin: 0 }}>
                    Valid ticket. Guest may enter.
                  </p>
                </div>

                <div
                  style={{
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    gap: "14px",
                    margin: "10px 0",
                    fontSize: "12px",
                    fontWeight: "500",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#475569" }}>Events</span>
                    <span
                      style={{
                        fontWeight: "700",
                        textAlign: "right",
                        maxWidth: "220px",
                        color: "#000000",
                      }}
                    >
                      {pdfTicketsData.item.eventName}
                    </span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#475569" }}>Customer</span>
                    <span style={{ fontWeight: "700", color: "#000000" }}>
                      {/* [LAMA] {pdfTicketsData.item.customerName || "mutiara"} */}
                      {pdfTicketsData.item.customerName || "-"}
                    </span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#475569" }}>Ticket Type</span>
                    <span style={{ fontWeight: "700", color: "#000000" }}>
                      {pdfTicketsData.item.ticketType}
                    </span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#475569" }}>Date & Time</span>
                    <span style={{ fontWeight: "700", color: "#000000" }}>
                      {pdfTicketsData.item.dateTime}
                    </span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#475569" }}>Location</span>
                    <span style={{ fontWeight: "700", color: "#000000", textAlign: "right", maxWidth: "220px" }}>
                      {pdfTicketsData.item.location}
                    </span>
                  </div>

                  <div
                    style={{
                      paddingTop: "10px",
                      borderTop: "1px solid #cbd5e1",
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <span style={{ color: "#475569" }}>Total Amount</span>
                    <span style={{ fontWeight: "700", color: "#000000" }}>
                      {/* [LAMA] {formatRupiah(pdfTicketsData.item.totalAmount || 166500)} */}
                      {formatRupiah(pdfTicketsData.item.totalAmount ?? 0)}
                    </span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#475569" }}>Ticket ID</span>
                    <span
                      style={{
                        fontFamily: "monospace",
                        fontWeight: "700",
                        fontSize: "13px",
                        letterSpacing: "1px",
                        color: "#000000",
                      }}
                    >
                      {t.id}
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    marginTop: "24px",
                    marginBottom: "8px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  {/* [LAMA] QR dari layanan luar, isinya id acak
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${t.id}`}
                    alt="QR Code"
                    width={160}
                    height={160}
                    style={{ border: "1px solid #e2e8f0", borderRadius: "12px", padding: "8px", background: "#ffffff" }}
                    crossOrigin="anonymous"
                  />
                  */}
                  {/* [BARU] QR dibuat di browser, isinya qrToken asli yang dicek scanner */}
                  <div
                    style={{
                      border: "1px solid #e2e8f0",
                      borderRadius: "12px",
                      padding: "8px",
                      background: "#ffffff",
                    }}
                  >
                    <QRCodeCanvas value={t.qr} size={160} level="H" />
                  </div>
                  <p
                    style={{
                      fontSize: "10px",
                      color: "#475569",
                      marginTop: "16px",
                      textAlign: "center",
                      margin: "0",
                    }}
                  >
                    Tunjukkan QR Code ini di pintu masuk acara
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}