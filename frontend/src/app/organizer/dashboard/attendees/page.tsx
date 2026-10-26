"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "@/components/sidebar/SidebarDashboard";
import AttendeeSummaryCards from "@/components/dashboard/attendees/AttendeeSummaryCards";
import AttendeeFilters, { EventFilterOption } from "@/components/dashboard/attendees/AttendeeFilters";
import AttendeeTable from "@/components/dashboard/attendees/AttendeeTable";
import Pagination from "@/components/dashboard/transactions/Pagination";
import { AttendeeItem } from "@/types/attendee";
import Footer from "@/components/menubar/footer";
import NavbarOrganizer from "@/components/menubar/navbarOrganizer";

export default function AttendeesPage() {
  const [attendees, setAttendees] = useState<AttendeeItem[]>([]);
  const [eventsList, setEventsList] = useState<EventFilterOption[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [selectedEvent, setSelectedEvent] = useState<string>("ALL");
  const [ticketTierFilter, setTicketTierFilter] = useState<string>("ALL");
  const [statusTab, setStatusTab] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 6;

  // 1. Fungsi Mengambil Data Peserta (E-Ticket) & Event dari Database melalui Backend Express
  const fetchAttendeesAndEvents = async () => {
    try {
      setLoading(true);

      // A. Ambil Daftar E-Ticket Peserta
      const resAttendees = await fetch("/api/organizer/attendees");
      const jsonAttendees = await resAttendees.json();
      if (jsonAttendees.success && Array.isArray(jsonAttendees.data)) {
        setAttendees(jsonAttendees.data);
      }

      // B. Ambil Daftar Event milik Organizer untuk Dropdown Filter
      const resEvents = await fetch("/api/organizer/events");
      const jsonEvents = await resEvents.json();
      if (jsonEvents.success && Array.isArray(jsonEvents.data)) {
        const mappedEvents: EventFilterOption[] = jsonEvents.data.map((ev: any) => ({
          id: String(ev.id),
          title: String(ev.title),
        }));
        setEventsList(mappedEvents);
      }
    } catch (error) {
      console.error("Gagal memuat data peserta:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendeesAndEvents();
  }, []);

  // 2. Saring Data Berdasarkan Event yang Dipilih (Untuk Menghitung Kartu Ringkasan)
  const eventScopedAttendees = attendees.filter((item) => {
    if (selectedEvent === "ALL") return true;
    return item.eventId === selectedEvent;
  });

  // 3. Perhitungan Matematika Metrik Ringkasan secara Real-Time
  const totalRegistered = eventScopedAttendees.length;
  const totalAttended = eventScopedAttendees.filter((item) => item.status === "ATTENDED").length;
  const notYetArrived = totalRegistered - totalAttended;
  const totalRevenue = eventScopedAttendees.reduce((sum, item) => sum + Number(item.totalPaid || 0), 0);

  // 4. Saring Data lanjutan berdasarkan Kategori Tiket, Status Kehadiran, dan Kata Kunci Pencarian
  const filteredAttendees = eventScopedAttendees.filter((item) => {
    const matchTier =
      ticketTierFilter === "ALL"
        ? true
        : String(item.ticketTier).toUpperCase() === ticketTierFilter.toUpperCase();

    const matchStatus = statusTab === "ALL" ? true : item.status === statusTab;

    const query = searchQuery.trim().toLowerCase();
    const matchSearch =
      !query ||
      item.customerName.toLowerCase().includes(query) ||
      item.email.toLowerCase().includes(query) ||
      item.ticketCode.toLowerCase().includes(query);

    return matchTier && matchStatus && matchSearch;
  });

  // 5. Logika Pagination (Pembagian Halaman Tabel)
  const totalItems = filteredAttendees.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedAttendees = filteredAttendees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // 6. Fitur Export CSV (Dilengkapi Sanitasi Tanda Kutip & UTF-8 BOM agar Rapi di Excel)
  const handlerExportCSV = () => {
    if (filteredAttendees.length === 0) {
      alert("Tidak ada data peserta yang dapat diekspor pada filter saat ini.");
      return;
    }

    const escapeCsvField = (value: unknown) => {
      const str = String(value ?? "-").replace(/"/g, '""');
      return `"${str}"`;
    };

    const headers = [
      "Ticket Code",
      "Customer Name",
      "Email",
      "Event Name",
      "Ticket Tier",
      "Qty",
      "Amount Paid (IDR)",
      "Status",
      "Check-In Time",
    ];

    const rows = filteredAttendees.map((item) => {
      const formattedTime = item.checkInTime
        ? new Date(item.checkInTime).toLocaleString("id-ID")
        : "-";

      return [
        escapeCsvField(item.ticketCode),
        escapeCsvField(item.customerName),
        escapeCsvField(item.email),
        escapeCsvField(item.eventName),
        escapeCsvField(item.ticketTier),
        escapeCsvField(item.quantity),
        escapeCsvField(item.totalPaid),
        escapeCsvField(item.status),
        escapeCsvField(formattedTime),
      ];
    });

    // Tambahkan \uFEFF (Byte Order Mark) di awal string agar Microsoft Excel langsung mengenali karakter UTF-8
    const csvString = "\uFEFF" + [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Attendee_List_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F4] text-neutral-800 font-sans flex flex-col justify-between">
      <NavbarOrganizer />
      <div className="flex-1 w-full p-4 md:p-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-6 items-start">
          <Sidebar />

          <main className="flex-1 w-full bg-white rounded-2xl p-6 md:p-8 shadow-xs border border-neutral-100">
            <AttendeeFilters
              selectedEvent={selectedEvent}
              onEventChange={(eventId) => {
                setSelectedEvent(eventId);
                setCurrentPage(1);
              }}
              eventsList={eventsList}
              ticketTierFilter={ticketTierFilter}
              onTicketTierChange={(tier) => {
                setTicketTierFilter(tier);
                setCurrentPage(1);
              }}
              statusTab={statusTab}
              onStatusTabChange={(tab) => {
                setStatusTab(tab);
                setCurrentPage(1);
              }}
              searchQuery={searchQuery}
              onSearchChange={(query) => {
                setSearchQuery(query);
                setCurrentPage(1);
              }}
              onExportCSV={handlerExportCSV}
            >
              <AttendeeSummaryCards
                totalRegistered={totalRegistered}
                totalAttended={totalAttended}
                notYetArrived={notYetArrived}
                totalRevenue={totalRevenue}
              />
            </AttendeeFilters>

            {loading ? (
              <div className="py-16 text-center text-neutral-400 text-sm">
                Loading attendee list from database...
              </div>
            ) : (
              <AttendeeTable attendees={paginatedAttendees} />
            )}

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </main>
        </div>
      </div>
      <Footer />
    </div>
  );
}
