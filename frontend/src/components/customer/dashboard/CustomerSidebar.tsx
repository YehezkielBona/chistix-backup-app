"use client";

import React from "react";
import { LayoutGrid, Calendar, FileText, UserCheck, Star } from "lucide-react";
import { TabType } from "@/app/customer/dashboard/page";

interface CustomerSidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export default function CustomerSidebar({ activeTab, setActiveTab }: CustomerSidebarProps) {
  const menuItems = [
    { id: "overview", label: "Overview", icon: LayoutGrid },
    { id: "events", label: "Events", icon: Calendar },
    { id: "transactions", label: "Transactions", icon: FileText },
    { id: "checkin", label: "Checkin", icon: UserCheck },
    { id: "reviews", label: "Reviews", icon: Star },
  ] as const;

  return (
    <aside className="w-full md:w-64 flex-shrink-0 bg-white rounded-2xl p-4 shadow-xs border border-neutral-100">
      <nav className="flex flex-col gap-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as TabType)}
              className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-xs font-medium transition-all text-left ${
                isActive
                  ? "bg-amber-50 text-amber-500 font-bold"
                  : "text-neutral-700 hover:bg-neutral-50"
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? "text-amber-500" : "text-neutral-500"}`} />
              {item.label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}