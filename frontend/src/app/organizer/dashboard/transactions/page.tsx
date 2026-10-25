"use client";

import React, { useEffect, useState } from "react";
import Sidebar from "@/components/sidebar/SidebarDashboard";
import TransactionFilters, { EventOption } from "@/components/dashboard/transactions/TransactionFilters";
import TransactionTable from "@/components/dashboard/transactions/TransactionTable";
import ReviewAction from "@/components/dashboard/transactions/ReviewAction";
import ViewAction from "@/components/dashboard/transactions/ViewAction";
import Pagination from "@/components/dashboard/transactions/Pagination";
import Footer from "@/components/menubar/footer";
import NavbarOrganizer from "@/components/menubar/navbarOrganizer";
import { TransactionItem } from "@/types/transaction";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [eventsList, setEventsList] = useState<EventOption[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [selectedTrxForReview, setSelectedTrxForReview] = useState<TransactionItem | null>(null);
  const [selectedTrxForView, setSelectedTrxForView] = useState<TransactionItem | null>(null);
  const [isActionOpen, setIsActionOpen] = useState<boolean>(false);
  const [isViewActionOpen, setIsViewActionOpen] = useState<boolean>(false);

  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [selectedEvent, setSelectedEvent] = useState<string>("All Event");
  const [selectedDateRange, setSelectedDataRange] = useState<string>("Last 30 Days");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 6;

  const fetchData = async () => {
    try {
      setLoading(true);
      const resTrx = await fetch("/api/organizer/transactions");
      const jsonTrx = await resTrx.json();

      if (jsonTrx.success && jsonTrx.data) {
        const formatted: TransactionItem[] = jsonTrx.data.map((item: any) => ({
          id: item.id,
          eventId: item.eventId,
          customerName: item.user?.name || "Customer",
          customerEmail: item.user?.email || "-",
          eventName: item.event?.title || "Untitled Event",
          ticketTier: item.ticketType || "Regular",
          quantity: item.quantity,
          normalPrice: item.normalPrice,
          discPrice: item.discPrice,
          pointUsed: item.pointUsed,
          totalPrice: item.totalPrice,
          status: item.status,
          paymentProof: item.paymentProof,
          voucherCode: item.voucher?.code || null,
          createdAt: item.createdAt,
        }));
        setTransactions(formatted);
      }

      const resEvents = await fetch("/api/organizer/events");
      const jsonEvents = await resEvents.json();
      if (jsonEvents.success && jsonEvents.data) {
        setEventsList(
          jsonEvents.data.map((e: any) => ({
            id: e.id,
            title: e.title,
          })),
        );
      }
    } catch (error) {
      console.error("Failed load transactions: ", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const isWithinDateFilter = (createdAtString: string) => {
    const trxDate = new Date(createdAtString);
    const now = new Date();
    const diffInMiliSeconds = now.getTime() - trxDate.getTime();
    const diffInDays = diffInMiliSeconds / (1000 * 60 * 60 * 24);

    if (diffInDays > 365) return false;
    if (selectedDateRange === "THIS_WEEK") {
      return diffInDays >= 0 && diffInDays <= 7;
    }
    if (selectedDateRange === "THIS_MONTH") {
      return trxDate.getMonth() === now.getMonth() && trxDate.getFullYear() === now.getFullYear();
    }
    if (selectedDateRange === "THIS_YEAR") {
      return trxDate.getFullYear() === now.getFullYear();
    }
    return true;
  };

  const filteredData = transactions.filter((trx) => {
    if (activeTab !== "ALL" && trx.status !== activeTab) return false;
    if (selectedEvent !== "ALL" && trx.eventId !== selectedEvent) return false;
    if (!isWithinDateFilter(trx.createdAt)) return false;
    return true;
  });

  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleOpenReview = (trx: TransactionItem) => {
    setSelectedTrxForReview(trx);
    setIsActionOpen(true);
  };

  const handleAcceptTransaction = async (trxId: string) => {
    try {
      const res = await fetch(`/api/organizer/transactions/${trxId}/accept`, {
        method: "PUT",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to Accept Transactions!");

      setTransactions((prev) => prev.map((trx) => (trx.id === trxId ? { ...trx, status: "DONE" } : trx)));
      setIsActionOpen(false);
      setSelectedTrxForReview(null);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRejectTransaction = async (trxId: string) => {
    try {
      const res = await fetch(`/api/organizer/transactions/${trxId}/reject`, {
        method: "PUT",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to Reject Transactions!");

      setTransactions((prev) => prev.map((trx) => (trx.id === trxId ? { ...trx, status: "REJECTED" } : trx)));
      setIsActionOpen(false);
      setSelectedTrxForReview(null);
    } catch (err: any) {
      alert(err.message);
    }
  };

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
              onEventChange={(ev) => {
                setSelectedEvent(ev);
                setCurrentPage(1);
              }}
              selectedDateRange={selectedDateRange}
              onDateRangeChange={(range) => {
                setSelectedDataRange(range);
                setCurrentPage(1);
              }}
              eventsList={eventsList}
            />

            {loading ? (
              <div className="py-16 text-center text-neutral-400 text-sm">Loading Transactions ...</div>
            ) : (
              <TransactionTable
                transactions={paginatedData}
                onReview={(trx) => {
                  setSelectedTrxForReview(trx);
                  setIsActionOpen(true);
                }}
                onView={(trx) => {
                  setSelectedTrxForView(trx);
                  setIsViewActionOpen(true);
                }}
              />
            )}
            <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={totalItems} itemsPerPage={itemsPerPage} onPageChange={(page) => setCurrentPage(page)} />
          </main>
        </div>

        <ReviewAction
          isOpen={isActionOpen}
          transaction={selectedTrxForReview}
          onClose={() => {
            setIsActionOpen(false);
            setSelectedTrxForReview(null);
          }}
          onAccept={handleAcceptTransaction}
          onReject={handleRejectTransaction}
        />
        <ViewAction
          isOpen={isViewActionOpen}
          transaction={selectedTrxForView}
          onClose={() => {
            setIsViewActionOpen(false);
            setSelectedTrxForView(null);
          }}
        />
      </div>
      <Footer />
    </div>
  );
}
