"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import OverviewTab from "@/components/customer/dashboard/OverviewTab";
import EventsTab from "@/components/customer/dashboard/EventsTab";
import TransactionsTab from "@/components/customer/dashboard/TransactionsTab";
import CheckInTab from "@/components/customer/dashboard/CheckInTab";
import ReviewsTab from "@/components/customer/dashboard/ReviewsTab";
import CustomerSidebar from "@/components/customer/dashboard/CustomerSidebar";
import NavbarNotLoggedIn from "@/components/menubar/navbar";

export type TabType = "overview" | "events" | "transactions" | "checkin" | "reviews";

export interface TransactionItem {
  id: string;
  title: string;
  qty: string;
  ticketType: string;
  status: "Waiting Payment" | "Done" | "Canceled";
  price: string;
  location?: string;
  code?: string;
}

export interface AttendedEvent {
  id: string;
  title: string;
  ticketType: string;
  attendedDate: string;
  imageUrl: string;
}

export interface ReviewItem {
  id: string;
  eventId: string;
  title: string;
  ticketType: string;
  rating: number;
  feedback: string;
  date: string;
  imageUrl: string;
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") as TabType | null;

  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [userPoints, setUserPoints] = useState<number>(0);

  // Efek untuk membaca query parameter ?tab=... dari URL
  useEffect(() => {
    if (
      tabParam &&
      ["overview", "events", "transactions", "checkin", "reviews"].includes(tabParam)
    ) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // 1. State Transaksi (Sumber utama data)
  const [transactions, setTransactions] = useState<TransactionItem[]>([
    {
      id: "trx-1",
      title: "Resonance Soundfest 2026: Intimate Live Performance",
      qty: "x1",
      ticketType: "VIP",
      status: "Waiting Payment",
      price: "Rp. 550.000,00",
      location: "Istora Senayan Jakarta",
      code: "CHX-AB1F-22",
    },
    {
      id: "trx-2",
      title: "Jazz evening at the Park",
      qty: "x2",
      ticketType: "Regular",
      status: "Done",
      price: "Rp. 300.000,00",
    },
    {
      id: "trx-3",
      title: "Indie Wave Fest: Sunset Beach Session",
      qty: "x1",
      ticketType: "Presale",
      status: "Canceled",
      price: "Rp. 550.000,00",
    },
  ]);

  // 2. State Event yang sudah Attended (untuk Check-in & Review)
  const [attendedEvents, setAttendedEvents] = useState<AttendedEvent[]>([
    {
      id: "evt-1",
      title: "Content Creator Talkshow: Turning Passion into Career",
      ticketType: "Ticket Regular x1",
      attendedDate: "20 Sept 2026, 09:15",
      imageUrl: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=300&auto=format&fit=crop&q=60",
    },
    {
      id: "evt-2",
      title: "Night Symphony Classic Meets Rock",
      ticketType: "Ticket VIP x1",
      attendedDate: "20 Sep 2026",
      imageUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=60",
    },
  ]);

  // 3. State Daftar Review
  const [myReviews, setMyReviews] = useState<ReviewItem[]>([
    {
      id: "rev-1",
      eventId: "evt-jazz",
      title: "Jazz Evening at the Park",
      ticketType: "Ticket General x1",
      rating: 5,
      feedback: "Acara sangat meriah dan tata suaranya luar biasa bagus. Semoga tahun depan diadakan lagi!",
      date: "15 Sep 2026",
      imageUrl: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=200&auto=format&fit=crop&q=60",
    },
  ]);

  // Hitung jumlah upcoming/registered tickets dari transaksi yang berstatus "Waiting Payment" / "Done"
  const upcomingTicketsCount = transactions.filter(
    (t) => t.status === "Waiting Payment" || t.status === "Done"
  ).length;

  return (
    <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-6 items-start mt-6">
      <CustomerSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 w-full max-w-3xl bg-white rounded-2xl p-6 md:p-8 shadow-xs border border-neutral-100">
        {activeTab === "overview" && (
          <OverviewTab
            setActiveTab={setActiveTab}
            points={userPoints}
            attendedEvents={attendedEvents}
            upcomingTicketsCount={upcomingTicketsCount}
            transactions={transactions}
          />
        )}

        {activeTab === "events" && <EventsTab />}
        {activeTab === "transactions" && <TransactionsTab transactions={transactions} />}

        {activeTab === "checkin" && (
          <CheckInTab
            setActiveTab={setActiveTab}
            attendedEvents={attendedEvents}
            transactions={transactions}
          />
        )}

        {activeTab === "reviews" && (
          <ReviewsTab
            attendedEvents={attendedEvents}
            setAttendedEvents={setAttendedEvents}
            myReviews={myReviews}
            setMyReviews={setMyReviews}
          />
        )}
      </main>
    </div>
  );
}

export default function CustomerDashboardPage() {
  return (
    <div className="min-h-screen bg-[#FAF8F4] text-neutral-800 p-4 md:p-8 font-sans">
      <NavbarNotLoggedIn />
      <Suspense fallback={<div className="text-center py-10 text-xs text-neutral-400">Loading dashboard...</div>}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}