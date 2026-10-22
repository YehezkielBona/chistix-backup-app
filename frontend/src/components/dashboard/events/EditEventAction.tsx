import React, { useState, useEffect } from "react";
import { EventItem } from "@/types/event";
import { XMarkIcon, PencilSquareIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";

interface EditEventActionProps {
  isOpen: boolean;
  event: EventItem | null;
  onClose: () => void;
  onSave: (updatedEvent: EventItem) => void;
  onEndEvent: (eventId: string) => void; 
}

export default function EditEventAction({
  isOpen,
  event,
  onClose,
  onSave,
  onEndEvent,
}: EditEventActionProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState("");
  const [venueDetail, setVenueDetail] = useState("");
  const [totalTicket, setTotalTicket] = useState(0);
  const [description, setDescription] = useState("");


  const [showEndConfirm, setShowEndConfirm] = useState(false);

  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setCategory(event.category || "Music");
      setDate(event.date);
      setVenueDetail(event.venueDetail);
      setTotalTicket(event.totalTicket);
      setDescription(event.description || "");
      setShowEndConfirm(false); 
    }
  }, [event]);

  if (!isOpen || !event) return null;

  const isUpcoming = event.status === "UPCOMING";

  const isOnStage = event.status === "ON STAGE"

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...event,
      title,
      category,
      date,
      venueDetail,
      totalTicket,
      description,
    });
    onClose();
  };

  const handleConfirmEnd = () => {
    onEndEvent(event.id);
    setShowEndConfirm(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl border border-neutral-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200 relative">
        
        {showEndConfirm && (
          <div className="absolute inset-0 bg-white z-20 p-6 flex flex-col justify-between animate-in fade-in duration-150">
            <div>
              <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center mb-4">
                <ExclamationTriangleIcon className="w-6 h-6 text-rose-600" />
              </div>
              <h3 className="text-lg font-bold text-neutral-900">
                Akhiri Acara Ini Sekarang?
              </h3>
              <p className="text-xs md:text-sm text-neutral-500 mt-2 leading-relaxed">
                Anda akan mengubah status event <span className="font-semibold text-neutral-800">&ldquo;{event.title}&rdquo;</span> menjadi <strong className="text-rose-600">ENDED</strong>. 
                Tiket tidak dapat dibeli lagi oleh publik dan event akan dipindahkan ke riwayat acara selesai.
              </p>
            </div>

            <div className="flex gap-3 pt-6 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setShowEndConfirm(false)}
                className="flex-1 py-2.5 rounded-full text-xs md:text-sm font-semibold text-neutral-600 border border-neutral-200 hover:bg-neutral-50 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmEnd}
                className="flex-1 py-2.5 rounded-full text-xs md:text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 transition-colors cursor-pointer shadow-xs"
              >
                Ya, Akhiri Acara
              </button>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center px-6 py-4 border-b border-neutral-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-[#BB4D00]">
              <PencilSquareIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-neutral-900 text-base">Edit Event</h2>

                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isUpcoming || isOnStage ? "bg-emerald-100 text-emerald-700" : "bg-neutral-100 text-neutral-600"
                }`}>
                  {isUpcoming || isOnStage ? "Live / Upcoming" : "Draft"}
                </span>
              </div>
              <p className="text-xs text-neutral-400">ID: #{event.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-700 p-1 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4 text-xs md:text-sm max-h-[65vh] overflow-y-auto">
            
            {isUpcoming || isOnStage && (
              <div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl text-xs text-amber-800">
                💡 <strong>Catatan Organizer:</strong> Event ini sedang aktif tayang. Jika acara telah selesai dilaksanakan, klik tombol <strong>&quot;End This Event&quot;</strong> di bawah.
              </div>
            )}

            <div>
              <label className="block text-neutral-700 font-semibold mb-1">Event Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-neutral-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-[#BB4D00] bg-neutral-50"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-neutral-700 font-semibold mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full border border-neutral-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-[#BB4D00] bg-neutral-50 cursor-pointer"
                >
                  <option value="Music">Music</option>
                  <option value="Art">Art</option>
                  <option value="Sports">Sports</option>
                  <option value="Technology">Technology</option>
                  <option value="Business">Business</option>
                  <option value="Education">Education</option>
                </select>
              </div>

              <div>
                <label className="block text-neutral-700 font-semibold mb-1">Event Date</label>
                <input
                  type="text"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full border border-neutral-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-[#BB4D00] bg-neutral-50"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-neutral-700 font-semibold mb-1">Total Ticket Quota</label>
              <input
                type="number"
                min={1}
                value={totalTicket}
                onChange={(e) => setTotalTicket(Number(e.target.value))}
                className="w-full border border-neutral-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-[#BB4D00] bg-neutral-50"
                required
              />
            </div>

            <div>
              <label className="block text-neutral-700 font-semibold mb-1">Venue Location Detail</label>
              <input
                type="text"
                value={venueDetail}
                onChange={(e) => setVenueDetail(e.target.value)}
                className="w-full border border-neutral-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-[#BB4D00] bg-neutral-50"
                required
              />
            </div>

            <div>
              <label className="block text-neutral-700 font-semibold mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full border border-neutral-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-[#BB4D00] bg-neutral-50 resize-none"
              />
            </div>
          </div>

          {/* Footer Modal */}
          <div className="flex items-center justify-between px-6 py-4 bg-neutral-50 border-t border-neutral-100">
            
            <div>
              {isUpcoming || isOnStage && (
                <button
                  type="button"
                  onClick={() => setShowEndConfirm(true)}
                  className="px-3.5 py-2 rounded-full text-xs font-semibold text-rose-600 border border-rose-300 hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  End This Event
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-full text-xs md:text-sm font-semibold text-neutral-600 hover:bg-neutral-200/60 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-full text-xs md:text-sm font-semibold text-white bg-[#EA580C] hover:bg-[#BB4D00] transition-colors cursor-pointer shadow-xs"
              >
                Save Changes
              </button>
            </div>

          </div>
        </form>

      </div>
    </div>
  );
}