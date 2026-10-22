"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Sidebar from "@/components/sidebar/SidebarDashboard";
import EventStatusBadge from "@/components/dashboard/events/EventStatusBadge";
import PublishConfirmAction from "@/components/dashboard/events/PublishConfirmAction";
import AttendeeListAction from "@/components/dashboard/events/AttendeeListAction";
import QRListAction from "@/components/dashboard/events/QRListAction";
import EditEventAction from "@/components/dashboard/events/EditEventAction";
import { EventItem, EventStatus } from "@/types/event";
import { PencilSquareIcon, UserGroupIcon, QrCodeIcon, ArrowUpCircleIcon, ChartBarIcon, MagnifyingGlassIcon, PlusIcon, StopCircleIcon, TrashIcon } from "@heroicons/react/24/outline";
import Footer from "@/components/menubar/footer";
import NavbarOrganizer from "@/components/menubar/navbarOrganizer";

export default function Eventspage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = useState(true)

  const fetchEvents = async () => {
    try {
      setIsLoading(true)
      const res = await fetch("/api/organizer/events")
      const json = await res.json()
      if (json.success && json.data) {
        const formatted = json.data.map((evt: any) => {

          const startDateObj = evt.startDate ? new Date(evt.startDate) : (evt.date ? new Date(evt.date): null);
          const endDateObj = evt.endDate ? new Date(evt.endDate) : null

          const dateText = startDateObj && !isNaN(startDateObj.getTime())
          ? startDateObj.toLocaleDateString("id-ID", {
              day: "numeric",
              month: "short",
              year: "numeric",
          })
          : "-"

          const startTimeStr = startDateObj && !isNaN(startDateObj.getTime())
          ? startDateObj.toLocaleTimeString("id-ID", {hour: "2-digit", minute: "2-digit"}) : "";
          const endTimeStr = endDateObj && !isNaN(endDateObj.getTime())
          ? endDateObj?.toLocaleTimeString("id-ID", {hour: "2-digit", minute: "2-digit"}) : "";

          const timeText = startTimeStr && endTimeStr ?
          `${startTimeStr} - ${endTimeStr} WIB` : startTimeStr ? `${startTimeStr} WIB` : ""
          
          return {
            ...evt,
            date: dateText,
            timeRange: timeText,
          };
        });
        setEvents(formatted);
      }
    } catch (err) {
      console.error("Gagal load events: ", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [])

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeStatusFilter, setActiveStatusFilter] = useState<string>("All");

  const [publishTarget, setPublishTarget] = useState<EventItem | null>(null);
  const [isPublishActionOpen, setIsPublishActionOpen] = useState(false);

  const [attendeeTarget, setAttendeeTarget] = useState<EventItem | null>(null);
  const [isAttendeeActionOpen, setIsAttendeeActionOpen] = useState(false);

  const [qrTarget, setQrTarget] = useState<EventItem | null>(null);
  const [isQRActionOpen, setIsQRActionOpen] = useState(false);

  const [editTarget, setEditTarget] = useState<EventItem | null>(null);
  const [isEditActionOpen, setIsEditActionOpen] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<EventItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const statusPriority: Record<string, number> = {
    "ON STAGE": 1,
    UPCOMING: 2,
    DRAFT: 3,
    ENDED: 4,
  };
  const filteredEvents = events.filter((event) => {
    const matchSearch =
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (event.city ? event.city.toLowerCase().includes(searchQuery.toLowerCase()) : false);

    const normalizedEventStatus = (event.status || "").replace("_", " ").toLowerCase();
    const normalizedFilter = activeStatusFilter.toLowerCase();
    const matchStatus =
      activeStatusFilter === "All" ? true : normalizedEventStatus === normalizedFilter;
    return matchSearch && matchStatus;
  });
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    const priorityA = statusPriority[a.status] || statusPriority[a.status?.replace("_", " ")] || 99;
    const priorityB = statusPriority[b.status] || statusPriority[b.status?.replace("_", " ")] || 99;
    return priorityA - priorityB;
  });

  const handleConfirmPublish = () => {
    if (!publishTarget) return;
    setEvents((prev) => prev.map((e) => (e.id === publishTarget.id ? { ...e, status: "UPCOMING" } : e)));
    setIsPublishActionOpen(false);
    setPublishTarget(null);
  };

  const statusFilters: string[] = ["All", "On Stage", "Upcoming", "Draft", "Ended"];

  const handleSaveEdit = (updateEvent: EventItem) => {
    setEvents((prev) => prev.map((e) => (e.id === updateEvent.id ? updateEvent : e)));
    setIsEditActionOpen(false);
    setEditTarget(null);
  };

  const handleEndEvent = (eventId: string) => {
    setEvents((prev) => prev.map((e) => (e.id === eventId ? { ...e, status: "ENDED" } : e)));
  };

  const handleExecuteDelete = async () => {
    if(!deleteTarget) return
    try {
      setIsDeleting(true)
      const res = await fetch(`/api/organizer/events/${deleteTarget.id}`, {
        method: "DELETE",
      })
      const json = await res.json()
      if(!res.ok) throw new Error(json.message)
      
      fetchEvents()
      setDeleteTarget(null)
    } catch (err: any) {
      alert("Gagal menghapus: " + err.message)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF8F4] text-neutral-800 font-sans flex flex-col justify-between">
      <NavbarOrganizer />
      <div className="flex-1 w-full p-4 md:p-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-6 items-start">
          <Sidebar />

          <main className="flex-1 w-full bg-white rounded-2xl p-6 md:p-8 shadow-xs border border-neutral-100">
            <div className="flex justify-between items-center mb-5">
              <h1 className="text-xl md:text-2xl font-bold text-neutral-900">Your Events</h1>
              <Link href="/organizer/dashboard/events/create" className="flex items-center gap-1.5 bg-[#EA580C] hover:bg-[#BB4D00] text-white px-4 py-2 rounded-full text-sm font-semibold transition-all shadow-xs cursor-pointer">
                <PlusIcon className="w-4 h-4" />
                <span>Create Event</span>
              </Link>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
              <div className="relative w-full sm:max-w-xs">
                <MagnifyingGlassIcon className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search event name, location ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-neutral-200 rounded-full bg-neutral-50 focus:outline-none focus:border-[#BB4D00] placeholder:text-neutral-400"
                />
              </div>

              <div className="flex gap-2 flex-wrap">
                {statusFilters.map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveStatusFilter(filter)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      activeStatusFilter === filter ? "bg-[#FFF5ED] text-[#BB4D00] border border-[#BB4D00]/40" : "bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50"
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs md:text-sm">
                <thead>
                  <tr className="text-neutral-900 font-semibold border-b border-neutral-100">
                    <th className="pb-3.5 px-4">Event</th>
                    <th className="pb-3.5">Date</th>
                    <th className="pb-3.5 px-4">Ticket Sold</th>
                    <th className="pb-3.5 px-4 text-center">Status</th>
                    <th className="pb-3.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-neutral-400 text-sm">
                        Loading data ...
                      </td>
                    </tr>
                  ):
                  sortedEvents.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-neutral-400 text-sm">
                        No events found, Click "Create-Event" to add first event
                      </td>
                    </tr>
                  ) : (
                    sortedEvents.map((event) => {
                      const totalSold = event.ticketTiers.reduce((sum, t) => sum + t.sold, 0);
                      const status = (event.status || "").replace(/\s+/g, "_").toUpperCase();

                      return (
                        <tr key={event.id} className="hover:bg-neutral-50/50 transition-colors">
                          <td className="py-4 pr-4 max-w-64">
                            <p className="font-semibold text-neutral-900 leading-snug line-clamp-2 px-4">{event.title}</p>
                            <p className="text-neutral-400 text-xs mt-0.5 px-4">{event.venueDetail}</p>
                          </td>
                          <td className="py-4 pr-4 whitespace-nowrap text-neutral-600">
                            <p className="font-semibold text-neutral-800">{event.date}</p>
                            {event.timeRange ? (
                              <p className="text-neutral-400 text-xs mt-0.5 font-medium">{event.timeRange}</p>
                            ): (
                              <p className="text-neutral-400 text-xs mt-0.5">
                                Waktu belum bisa diatur
                              </p>
                            )}
                          </td>
                          <td className="py-4 pr-4 px-4 whitespace-nowrap text-neutral-600 font-medium">
                            {totalSold} / {event.totalTicket}
                          </td>
                          <td className="py-4 pr-4 px-4 text-center">
                            <EventStatusBadge status={event.status} />
                          </td>
                          <td className="py-4 text-center">
                            <div className="flex items-center justify-center gap-2">

                              {status !== "ENDED" && (
                                <Link
                                  href={`/organizer/dashboard/events/edit/${event.id}`}
                                  className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-400 hover:text-[#BB4D00] hover:bg-[#FFF5ED] transition-colors cursor-pointer"
                                  title="Edit Event"
                                >
                                  <PencilSquareIcon className="w-4.5 h-4.5 text-black/80 hover:text-[#BB4D00]" />
                                </Link>
                              )}

                              {status === "ON_STAGE" && (
                                <button
                                  onClick={() => {
                                    setAttendeeTarget(event);
                                    setIsAttendeeActionOpen(true);
                                  }}
                                  className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                                  title="See Attendee List"
                                >
                                  <UserGroupIcon className="w-4.5 h-4.5 text-black/80 hover:text-emerald-600" />
                                </button>
                              )}

                              {status === "ON_STAGE" && (
                                <button
                                  onClick={() => {
                                    if(confirm(`Apakah event "${event.title}" telah selesai dan ingin ditutup (ENDED)?`)) {
                                      handleEndEvent(event.id);
                                    }
                                  }}
                                  className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                  title="Stop Event (set to Ended)"
                                >
                                  <StopCircleIcon className="w-4.5 h-4.5 hover:text-rose-600" />
                                </button>
                              )}

                              {status === "DRAFT" && (
                                <button
                                  onClick={() => {
                                    setPublishTarget(event);
                                    setIsPublishActionOpen(true);
                                  }}
                                  className="w-8 h-8 flex items-center justify-center rounded-lg text-amber-400 hover:text-amber-500 hover:bg-amber-50 transition-colors cursor-pointer"
                                  title="Publish Event"
                                >
                                  <ArrowUpCircleIcon className="w-4.5 h-4.5" />
                                </button>
                              )}

                              {(status === "DRAFT" || status === "UPCOMING") && (
                                <button
                                  onClick={() => setDeleteTarget(event)}
                                  className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                  title="Delete Event"
                                >
                                  <TrashIcon className="w-4.5 h-4.5" />
                                </button>
                              )}

                              {status === "ENDED" && (
                                <button
                                  onClick={() => alert(`Event Summary Report: ${event.title}`)}
                                  className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-400 hover:text-purple-500 hover:bg-purple-50 transition-colors cursor-pointer"
                                  title="View Summary Event"
                                >
                                  <ChartBarIcon className="w-4.5 h-4.5 text-black/80 hover:text-purple-500" />
                                </button>
                              )}

                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </main>
        </div>
      </div>

      {/* Modal Konfirmasi Delete Event (Soft Delete) */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop:blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl border border-neutral-100 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 mx-auto flex items-center justify-center">
              <TrashIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-neutral-900 text-base">Delete event?</h3>
              <p className="text-xs text-neutral-600 mt-1">
                Are you sure want to delete <strong>{deleteTarget.title}</strong>? This action will be soft delete
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2 rounded-full text-xs font-semibold text-neutral-600 border border-neutral-200 hover:bg-neutral-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteDelete}
                disabled={isDeleting}
                className="flex-1 py-2 rounded-full text-xs font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? "Deleting ..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <PublishConfirmAction
        isOpen={isPublishActionOpen}
        eventTitle={publishTarget?.title ?? ""}
        onClose={() => {
          setIsPublishActionOpen(false);
          setPublishTarget(null);
        }}
        onConfirmPublish={handleConfirmPublish}
      />

      <AttendeeListAction
        isOpen={isAttendeeActionOpen}
        eventTitle={attendeeTarget?.title ?? ""}
        onClose={() => {
          setIsAttendeeActionOpen(false);
          setAttendeeTarget(null);
        }}
      />

      <QRListAction
        isOpen={isQRActionOpen}
        eventTitle={qrTarget?.title ?? ""}
        onClose={() => {
          setIsQRActionOpen(false);
          setQrTarget(null);
        }}
      />

      <EditEventAction
        isOpen={isEditActionOpen}
        event={editTarget}
        onClose={() => {
          setIsEditActionOpen(false);
          setEditTarget(null);
        }}
        onSave={handleSaveEdit}
        onEndEvent={handleEndEvent}
      />
      <Footer />
    </div>
  );
}
