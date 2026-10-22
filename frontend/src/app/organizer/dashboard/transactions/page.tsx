"use client";

import React, { useState } from "react";
import Sidebar from "@/components/sidebar/SidebarDashboard";
import TransactionFilters from "@/components/dashboard/transactions/TransactionFilters";
import TransactionTable from "@/components/dashboard/transactions/TransactionTable";
import ReviewAction from "@/components/dashboard/transactions/ReviewAction";
import Pagination from "@/components/dashboard/transactions/Pagination";
import { TransactionItem } from "@/types/transaction";
import Footer from "@/components/menubar/footer";
import ViewAction from "@/components/dashboard/transactions/ViewAction";
import NavbarOrganizer from "@/components/menubar/navbarOrganizer";

const DUMMY_TRANSACTIONS: TransactionItem[] = [
  {
    id: "TRX-1024",
    customerName: "Budi_Santoso",
    eventName: "Resonance Soundfest 2026: Intimate Live Performance",
    ticketTier: "Presale VIP",
    quantity: 1,
    totalPrice: 300000,
    status: "WAITING_CONFIRM",
    autoCancelCountdown: "Auto cancel in 2d 4h",
  },
  {
    id: "TRX-1025",
    customerName: "Siti_Aminah",
    eventName: "Resonance Soundfest 2026: Intimate Live Performance",
    ticketTier: "Presale VIP",
    quantity: 1,
    totalPrice: 300000,
    status: "WAITING_CONFIRM",
    autoCancelCountdown: "Auto cancel in 2d 23h",
  },
  {
    id: "TRX-1026",
    customerName: "Rani_Putri",
    eventName: "Resonance Soundfest 2026: Intimate Live Performance",
    ticketTier: "Presale VIP",
    quantity: 1,
    totalPrice: 300000,
    status: "DONE",
  },
  {
    id: "TRX-1027",
    customerName: "Dimas_Putra",
    eventName: "Resonance Soundfest 2026: Intimate Live Performance",
    ticketTier: "Presale VIP",
    quantity: 1,
    totalPrice: 300000,
    status: "REJECTED",
  },
  {
    id: "TRX-1028",
    customerName: "Budiono_Siregar",
    eventName: "Resonance Soundfest 2026: Intimate Live Performance",
    ticketTier: "Presale VIP",
    quantity: 1,
    totalPrice: 300000,
    status: "CANCELED",
    autoCancelCountdown: "Auto cancel in 0h 0s",
  },
  {
    id: "TRX-1029",
    customerName: "Eko_Patrio",
    eventName: "Resonance Soundfest 2026: Intimate Live Performance",
    ticketTier: "Presale VIP",
    quantity: 1,
    totalPrice: 300000,
    status: "EXPIRED",
  },
  {
    id: "TRX-1030",
    customerName: "Andi_Wijaya",
    eventName: "Resonance Soundfest 2026: Intimate Live Performance",
    ticketTier: "Reguler",
    quantity: 2,
    totalPrice: 300000,
    status: "DONE",
  },
  {
    id: "TRX-1031",
    customerName: "Dewi_Lestari",
    eventName: "Resonance Soundfest 2026: Intimate Live Performance",
    ticketTier: "Presale VIP",
    quantity: 1,
    totalPrice: 300000,
    status: "WAITING_CONFIRM",
    autoCancelCountdown: "Auto cancel in 1d 12h",
  },
];

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<TransactionItem[]>(DUMMY_TRANSACTIONS);
  const [selectedTrxForReview, setSelectedTrxForReview] = useState<TransactionItem | null>(null);
  const [selectedTrxForView, setSelectedTrxForView] = useState<TransactionItem | null>(null)
  const [isActionOpen, setIsActionOpen] = useState<boolean>(false);
  const [isViewActionOpen, setIsViewActionOpen] = useState<boolean>(false)
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [selectedEvent, setSelectedEvent] = useState<string>("All Event");
  const [selectedDateRange, setSelectedDataRange] = useState<string>("Last 30 Days");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 6;

  const filteredData = transactions.filter((trx) => {
    if (activeTab === "ALL") return true;
    return trx.status === activeTab;
  });

  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleOpenReview = (trx: TransactionItem) => {
    setSelectedTrxForReview(trx);
    setIsActionOpen(true);
  };

  const handleAcceptTransaction = (trxId: string) => {
    setTransactions((prev) => prev.map((trx) => (trx.id === trxId ? { ...trx, status: "DONE", autoCancelCountdown: undefined } : trx)));
    setIsActionOpen(false);
    setSelectedTrxForReview(null);
  };

  const handleRejectTransaction = (trxId: string) => {
    setTransactions((prev) =>
      prev.map((trx) =>
        trx.id === trxId
          ? { ...trx, status: "REJECTED", autoCancelCountdown: undefined }
          : trx
      )
    );
    setIsActionOpen(false);
    setSelectedTrxForReview(null);
  }

  const handleCloseReview = () => {
    setIsActionOpen(false)
    setSelectedTrxForReview(null)
  }

  const handleOpenView = (trx: TransactionItem) => {
    setSelectedTrxForView(trx)
    setIsViewActionOpen(true)
  };

  const handleCloseView = () => {
    setIsViewActionOpen(false)
    setSelectedTrxForView(null)
  }

  return (
    <div className="min-h-screen bg-[#FAF8F4] text-neutral-800 font-sans flex flex-col justify-between">
      <NavbarOrganizer />
    <div className="min-h-screen bg-[#FAF8F4] text-neutral-800 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-6 items-start">
        <Sidebar />

        <main className="flex-1 w-full bg-white rounded-2xl p-6 md:p-8 shadow-xs border border-neutral-100">
          <TransactionFilters
            activeTab={activeTab}
            onTabChange={(tab) => {
              setActiveTab(tab);
              setCurrentPage(1);
            }}
            selectedEvent={selectedEvent}
            onEventChange={setSelectedEvent}
            selectedDateRange={selectedDateRange}
            onDateRangeChange={setSelectedDataRange}
          />

          <TransactionTable transactions={paginatedData} onReview={handleOpenReview} onView={handleOpenView} />

          <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={totalItems} itemsPerPage={itemsPerPage} onPageChange={(page) => setCurrentPage(page)} />
        </main>
      </div>
      <ReviewAction 
      isOpen={isActionOpen}
      transaction={selectedTrxForReview}
      onClose={handleCloseReview}
      onAccept={handleAcceptTransaction}
      onReject={handleRejectTransaction}
      />
      <ViewAction 
      isOpen={isViewActionOpen}
      transaction={selectedTrxForView}
      onClose={handleCloseView}
      />
    </div>
      <Footer />
    </div>
  );
}
