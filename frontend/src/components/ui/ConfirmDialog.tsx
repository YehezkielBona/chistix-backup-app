"use client";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

// Popup konfirmasi sebelum mengubah data (syarat requirement)
export default function ConfirmDialog({
  open, title, message, confirmLabel = "Ya, lanjutkan", loading, onConfirm, onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 space-y-4 shadow-lg">
        <h2 className="text-base font-bold text-slate-900">{title}</h2>
        <p className="text-sm text-slate-600">{message}</p>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onCancel} disabled={loading}
            className="px-4 py-2 text-xs font-semibold rounded-full bg-slate-100 text-slate-700">
            Batal
          </button>
          <button type="button" onClick={onConfirm} disabled={loading}
            className="px-4 py-2 text-xs font-bold rounded-full bg-[#FF8A00] text-white disabled:opacity-50">
            {loading ? "Memproses..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}