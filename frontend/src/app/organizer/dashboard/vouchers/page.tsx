"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/sidebar/SidebarDashboard";
import VoucherStatusBadge from "@/components/dashboard/vouchers/VoucherStatusBadge";
import { VoucherItem,} from "@/types/voucher";
import { MagnifyingGlassIcon, PlusIcon, PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";
import Footer from "@/components/menubar/footer";
import NavbarOrganizer from "@/components/menubar/navbarOrganizer";

export default function VouchersPage() {
  const [vouchers, setVouchers] = useState<VoucherItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<string>("All");

  const tabs = ["All", "Active", "Scheduled", "Expired"];

  const filteredVouchers = vouchers.filter((item) => {
    const matchSearch = item.code.toLocaleLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = activeTab === "All" ? true : item.status === activeTab.toUpperCase();
    return matchSearch && matchStatus;
  });

  const handleDeleteVoucher = (id: string, code: string) => {
    if (confirm(`Do you really want to delete this "${code} voucher?`)) {
      setVouchers((prev) => prev.filter((v) => v.id !== id));
    }
  };

  const fetchVouchers = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/organizer/vouchers");
      const json = await res.json();
      if (json.success && json.data) {
        setVouchers(
          json.data.map((v: any) => ({
            ...v,
            eventName: v.event?.title || "-",
            status: v.computedStatus,
          })),
        );
      }
    } catch (err) {
      console.error("Gagal load vouchers", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, []);

  return (
    <div className="min-h-screen bg-[#FAF8F4] text-neutral-800 font-sans flex flex-col justify-between">
      <NavbarOrganizer />
      <div className="flex-1 w-full p-4 md:p-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-6 items-start">
          <Sidebar />

          <main className="flex-1 w-full bg-white rounded-2xl p-6 md:p-8 shadow-xs border border-neutral-100">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-xl md:text-2xl font-bold text-neutral-900">Vouchers</h1>
              <Link href="/organizer/dashboard/vouchers/create" className="flex items-center gap-1.5 bg-black hover:bg-neutral-800 text-white px-4 py-2 rounded-full text-xs md:text-sm font-semibold transition-all shadow-xs cursor-pointer">
                <PlusIcon className="w-4 h-4" />
                <span>Create Voucher</span>
              </Link>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
              <div className="relative w-full sm:w-64">
                <MagnifyingGlassIcon className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search Voucher Code"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-1.5 text-xs md:text-sm text-neutral-900 font-medium border border-neutral-200 rounded-full bg-white focus:outline-none focus:border-[#BB4D00] placeholder:text-neutral-400 shadow-2xs"
                />
              </div>

              <div className="flex items-center gap-1.5">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab;
                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className={`px-3.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                        isActive ? "bg-[#FFF5ED] text-[#bb4d00] border border-[#bb4d00]/40 font-semibold shadow-2xs" : "bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50"
                      }`}
                    >
                      {tab}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs md:text-sm">
                <thead>
                  <tr className="text-[#bb4d00] font-semibold border-b border-neutral-100">
                    <th className="pb-3.5 pl-2">Code</th>
                    <th className="pb-3.5 text-center px-4">Event</th>
                    <th className="pb-3.5 text-center px-4">Discount</th>
                    <th className="pb-3.5 text-center px-4">Valid Period</th>
                    <th className="pb-3.5 text-center px-4">Used</th>
                    <th className="pb-3.5 text-center px-4">Status</th>
                    <th className="pb-3.5 text-center px-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredVouchers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-neutral-400 text-sm">
                        Cannot found voucher
                      </td>
                    </tr>
                  ) : (
                    filteredVouchers.map((item) => (
                      <tr key={item.id} className="hover:bg-neutral-50/50 transition-colors">
                        <td className="py-4 pl-2 font-bold text-neutral-900 font-mono tracking-wide">{item.code}</td>
                        <td className="py-4 px-4 text-center text-neutral-700 max-w-40 leading-snug">{item.eventName}</td>

                        <td className="py-4 px-4 text-center font-semibold text-neutral-900">
                          {item.discountType === "PERCENTAGE" ? `${item.discount}%` : 
                          `Rp ${Number(item.discount).toLocaleString("id-ID")}`}
                          </td>
                        <td className="py-4 px-4 text-center text-neutral-600 whitespace-nowrap">
                          {new Date(item.validStart).toLocaleDateString("id-ID", { day: "numeric", month: "short" })} - {new Date(item.validEnd).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                        </td>

                        <td className="py-4 px-4 text-center font-medium text-neutral-700">
                          {item.usedCount ?? 0} / {item.maxUsage ?? 100}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <VoucherStatusBadge status={item.status} />
                        </td>

                        <td className="py-4 pr-2 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Link href={`/organizer/dashboard/vouchers/edit/${item.id}`} className="text-neutral-400 hover:text-neutral-700 p-1 rounded-lg transition-colors" title="Edit Voucher">
                              <PencilSquareIcon className="w-4 h-4 text-black/80" />
                            </Link>
                            <button type="button" onClick={() => handleDeleteVoucher(item.id, item.code)} className="text-red-400 hover:text-red-600 p-1 rounded-lg transition-colors cursor-pointer" title="Delete Voucher">
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="pt-6 text-xs text-neutral-400">
              Showing 1 - {filteredVouchers.length} of {filteredVouchers.length}
            </div>
          </main>
        </div>
      </div>
      <Footer />
    </div>
  );
}
