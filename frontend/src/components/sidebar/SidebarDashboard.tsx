
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Squares2X2Icon,    // Overview
  CalendarIcon,      // Events
  ReceiptPercentIcon,// Transactions
  UserGroupIcon,     // Attendee list
  TicketIcon,        // Voucher
  StarIcon,          // Reviews
  QrCodeIcon,        // Scan QR
} from "@heroicons/react/24/outline";

export default function Sidebar() {
  const pathname = usePathname();

  const menuItems = [
    { name: "Overview", href: "/organizer/dashboard", icon: Squares2X2Icon },
    { name: "Events", href: "/organizer/dashboard/events", icon: CalendarIcon },
    { name: "Transactions", href: "/organizer/dashboard/transactions", icon: ReceiptPercentIcon },
    { name: "Attendee list", href: "/organizer/dashboard/attendees", icon: UserGroupIcon },
    { name: "Voucher", href: "/organizer/dashboard/vouchers", icon: TicketIcon },
    { name: "Reviews", href: "/organizer/dashboard/reviews", icon: StarIcon },
    { name: "QR Scan", href: "/organizer/dashboard/scanner", icon: QrCodeIcon },
    
  ];

  return (
    <aside className="w-full md:w-64 bg-white rounded-2xl p-4 shadow-xs border border-neutral-100 shrink-0">
      <nav className="space-y-1.5">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 group ${
                isActive
                  ? "text-[#BB4D00] font-semibold bg-[#FFF5ED] border border-[#BB4D00]/15"
                  : "text-neutral-900 hover:text-[#BB4D00] hover:bg-[#FFF5ED]/60"
              }`}
            >
              <Icon
                className={`w-5 h-5 transition-colors duration-200 ${
                  isActive
                    ? "text-[#BB4D00]"
                    : "text-neutral-900 group-hover:text-[#BB4D00]"
                }`}
              />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}