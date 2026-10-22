"use client";

import React, { useState } from "react";
import Sidebar from "@/components/sidebar/SidebarDashboard";
import AttendeeSummaryCards from "@/components/dashboard/attendees/AttendeeSummaryCards";
import AttendeeFilters from "@/components/dashboard/attendees/AttendeeFilters";
import AttendeeTable from "@/components/dashboard/attendees/AttendeeTable";
import Pagination from "@/components/dashboard/transactions/Pagination";
import { AttendeeItem } from "@/types/attendee";
import Footer from "@/components/menubar/footer";
import NavbarOrganizer from "@/components/menubar/navbarOrganizer";

const DUMMY_ATTENDEES: AttendeeItem[] = [
  {
    id: "ATT-1",
    eventId: "EVT-001",
    customerName: "Budi_Santoso",
    email: "budi@email.com",
    ticketTier: "Presale Regular",
    quantity: 1,
    totalPaid: 300000,
    status: "ATTENDED",
    checkInTime: "08:42",
  },
  {
    id: "ATT-2",
    eventId: "EVT-001",
    customerName: "Siti_Aminah",
    email: "siti@email.com",
    ticketTier: "Normal Regular",
    quantity: 2,
    totalPaid: 600000,
    status: "REGISTERED",
  },
  {
    id: "ATT-3",
    eventId: "EVT-001",
    customerName: "Rani_Putri",
    email: "rani17@email.com",
    ticketTier: "Presale VIP",
    quantity: 1,
    totalPaid: 550000,
    status: "ATTENDED",
    checkInTime: "08:20",
  },
  {
    id: "ATT-4",
    eventId: "EVT-001",
    customerName: "Dimas_Putra",
    email: "dimas@email.com",
    ticketTier: "Normal Regular",
    quantity: 1,
    totalPaid: 400000,
    status: "ATTENDED",
    checkInTime: "08:12",
  },
  {
    id: "ATT-5",
    eventId: "EVT-001",
    customerName: "Maya_Sari",
    email: "maya@email.com",
    ticketTier: "VVIP",
    quantity: 1,
    totalPaid: 1200000,
    status: "REGISTERED",
  },
  {
    id: "ATT-6",
    eventId: "EVT-001",
    customerName: "Andi_Wijaya",
    email: "andi@email.com",
    ticketTier: "Presale Regular",
    quantity: 1,
    totalPaid: 300000,
    status: "ATTENDED",
    checkInTime: "09:05",
  },
  {
    id: "ATT-7",
    eventId: "EVT-001",
    customerName: "Dewi_Lestari",
    email: "dewi@email.com",
    ticketTier: "Presale VIP",
    quantity: 1,
    totalPaid: 550000,
    status: "REGISTERED",
  },
];

export default function AttendeesPage() {
  const [attendees] = useState<AttendeeItem[]>(DUMMY_ATTENDEES);
  const [selectedEvent, setSelectedEvent] = useState<string>("Resonance Soundfest 2026: Intimate Live Performance");
  const [ticketTierFilter, setTicketTierFilter] = useState<string>("ALL");
  const [statusTab, setStatusTab] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 5;

  const totalRegistered = 312;
  const totalAttended = 200;
  const notYetArrived = totalRegistered - totalAttended;

  const filteredAttendees = attendees.filter((item) => {
    const matchTier = ticketTierFilter === "ALL" ? true : item.ticketTier === ticketTierFilter;
    const matchStatus = statusTab === "ALL" ? true : item.status === statusTab;
    const matchSearch = item.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || item.email.toLowerCase().includes(searchQuery.toLowerCase());

    return matchTier && matchStatus && matchSearch;
  });

  const totalItems = filteredAttendees.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedAttendees = filteredAttendees.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handlerExportCSV = () => {
    if (filteredAttendees.length === 0) {
      alert("There is no data customers can be export");
      return;
    }

    const headers = ["Customer Name", "Email", "Ticket Tier", "Qty", "Total Paid (IDR)", "Status", "Check-In Time"];

    const rows = filteredAttendees.map((item) => [`"${item.customerName}"`, `"${item.email}"`, `"${item.ticketTier}"`, `"${item.quantity}"`, `"${item.totalPaid}"`, `"${item.status}"`, `"${item.checkInTime || "-"}"`]);

    const csvString = [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
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
            onEventChange={setSelectedEvent}
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

          <AttendeeSummaryCards totalRegistered={totalRegistered} totalAttended={totalAttended} notYetArrived={notYetArrived} />
          </AttendeeFilters>


          <AttendeeTable attendees={paginatedAttendees} />

          <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={totalItems} itemsPerPage={itemsPerPage} onPageChange={(page) => setCurrentPage(page)} />
        </main>
        </div>
      </div>
      <Footer/>
    </div>
  );
}
