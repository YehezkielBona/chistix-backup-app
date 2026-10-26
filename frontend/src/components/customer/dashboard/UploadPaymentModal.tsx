"use client";

// [LAMA] import React, { useState, useRef } from "react";
import React, { useState, useRef, useEffect } from "react"; // [BARU] + useEffect (countdown)
import { UploadCloud, AlertCircle, Image as ImageIcon } from "lucide-react";
import { apiFetch } from "@/lib/api"; // [BARU]
// [LAMA] import type { ApiTransaction } from "@/types/api"; // [BARU]
import { TICKET_LABEL, type ApiTransaction } from "@/types/api"; // [BARU] + TICKET_LABEL

interface UploadPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void; // Prop tambahan untuk mengubah status transaksi
  transaction?: ApiTransaction | null; // [BARU] transaksi yang bukti bayarnya diupload
}

// [BARU] aturan file, harus sama dengan Multer di backend
const VALID_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 2 * 1024 * 1024; // 2 MB

const formatRupiah = (n: number) => "Rp " + n.toLocaleString("id-ID");

// [BARU] countdown sisa waktu bayar
function useCountdown(deadline?: string) {
  const [left, setLeft] = useState(0);
  useEffect(() => {
    if (!deadline) return;
    const tick = () => setLeft(Math.max(0, Math.floor((Date.parse(deadline) - Date.now()) / 1000)));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [deadline]);
  return [Math.floor(left / 3600), Math.floor((left % 3600) / 60), left % 60]
    .map((n) => String(n).padStart(2, "0"))
    .join(":");
}

export default function UploadPaymentModal({ isOpen, onClose, onSuccess, transaction }: UploadPaymentModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorType, setErrorType] = useState<"invalid_type" | "too_large" | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false); // [BARU]
  const [serverError, setServerError] = useState(""); // [BARU] pesan error dari backend

  // [BARU] countdown hanya untuk transaksi yang belum dibayar
  const countdown = useCountdown(
    transaction?.status === "WAITING_PAYMENT" ? transaction.paymentDeadline : undefined,
  );

  if (!isOpen) return null;

  const validateAndSetFile = (file: File) => {
    setErrorType(null);
    setSelectedFile(null);
    setServerError(""); // [BARU]

    // [LAMA] const validTypes = ["image/jpeg", "image/png", "image/jpg"];
    // [LAMA] if (!validTypes.includes(file.type)) {
    if (!VALID_TYPES.includes(file.type)) {
      setSelectedFile(file);
      setErrorType("invalid_type");
      return;
    }

    // [LAMA] const maxSizeInBytes = 3 * 1024 * 1024;
    // [LAMA] if (file.size > maxSizeInBytes) {
    if (file.size > MAX_SIZE) {
      setSelectedFile(file);
      setErrorType("too_large");
      return;
    }

    setSelectedFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setErrorType(null);
    setServerError(""); // [BARU]
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${Math.round(bytes / 1024)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // [BARU] kirim file ke backend (Multer -> Cloudinary)
  const handleSubmit = async () => {
    if (!selectedFile || errorType || !transaction) return;
    setUploading(true);
    setServerError("");
    try {
      const form = new FormData();
      form.append("paymentProof", selectedFile); // nama field harus sama dengan multer .single("paymentProof")
      await apiFetch(`/api/transactions/${transaction.id}/payment-proof`, { method: "POST", body: form });
      handleRemoveFile();
      if (onSuccess) onSuccess(); // TransactionsTab mengambil ulang data
      onClose();
    } catch (e) {
      setServerError((e as Error).message); // contoh: "Batas waktu 2 jam sudah lewat"
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-[500px] overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
        <h2 className="text-base font-bold text-neutral-900 mb-4">Upload Payment Proof</h2>

        <div className="rounded-2xl bg-neutral-100/70 p-4 mb-5 text-xs">
          <div className="flex items-center justify-between font-bold text-neutral-900 mb-2">
            {/* [LAMA] <span>Resonance Soundfest 2026: Intimate Live Performance</span> */}
            <span>{transaction?.event.title ?? "-"}</span>
            {/* [LAMA] <span className="text-red-500 text-[11px] font-semibold">01:59:59</span> */}
            {transaction?.status === "WAITING_PAYMENT" && (
              <span className="text-red-500 text-[11px] font-semibold">{countdown}</span>
            )}
          </div>

          <div className="space-y-1.5 text-neutral-600">
            <div className="flex justify-between">
              <span>Order</span>
              {/* [LAMA] #TRX-1030 */}
              <span className="font-semibold text-neutral-800">
                #{transaction ? transaction.id.slice(0, 8).toUpperCase() : "-"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Ticket</span>
              {/* [LAMA] Presale VIP x 1 */}
              {/* TODO schema v2: tambahkan transaction.ticketType di depan jumlah */}
              <span className="font-semibold text-neutral-800">
                {/* [LAMA] {transaction?.ticketType ? `${transaction.ticketType} ` : ""}x {transaction?.quantity ?? 0} */}
                {transaction ? `${TICKET_LABEL[transaction.ticketType]} ` : ""}x {transaction?.quantity ?? 0}
              </span>
            </div>
            <div className="flex justify-between pt-1 font-bold text-neutral-900">
              <span>Total Pay</span>
              {/* [LAMA] Rp. 430.000 */}
              <span>{formatRupiah(transaction?.totalPrice ?? 0)}</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-neutral-900 block">Proof of payment</label>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            // [LAMA] accept="image/jpeg, image/png, image/jpg"
            accept="image/jpeg, image/png, image/webp"
            className="hidden"
          />

          {errorType ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-red-100 bg-red-50/80 p-6 text-center">
              <AlertCircle className="h-7 w-7 text-red-500 mb-2" />
              <p className="text-xs font-bold text-red-600 mb-1">
                {/* [LAMA] "Only JPG or PNG files are allowed" : "File is too large. The maximum size is 3MB" */}
                {errorType === "invalid_type"
                  ? "Only JPG, PNG, or WEBP files are allowed"
                  : "File is too large. The maximum size is 2MB"}
              </p>
              <p className="text-[11px] text-neutral-600 mb-4">{selectedFile?.name}</p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-xs font-semibold text-neutral-700 shadow-xs hover:bg-neutral-50 transition-colors cursor-pointer"
              >
                Choose another file
              </button>
            </div>
          ) : selectedFile ? (
            <div className="flex items-center justify-between rounded-2xl border border-amber-200/80 bg-amber-50/40 p-3.5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-neutral-200 bg-white">
                  <ImageIcon className="h-6 w-6 text-red-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-neutral-900">{selectedFile.name}</p>
                  <p className="text-[10px] text-neutral-400 mt-0.5">
                    {formatFileSize(selectedFile.size)} ready to send
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-1 items-end">
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="rounded-md bg-red-100/80 px-2.5 py-1 text-[10px] font-semibold text-neutral-700 hover:bg-red-200/80 transition-colors cursor-pointer"
                >
                  Remove
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const url = URL.createObjectURL(selectedFile);
                    window.open(url, "_blank");
                  }}
                  className="rounded-md border border-neutral-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-neutral-600 hover:bg-neutral-50 transition-colors cursor-pointer"
                >
                  View image
                </button>
              </div>
            </div>
          ) : (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`flex flex-col items-center justify-center rounded-2xl border border-neutral-200 bg-neutral-100/60 p-8 text-center transition-colors ${isDragging ? "border-amber-500 bg-amber-50/50" : ""
                }`}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-600 mb-2">
                <UploadCloud className="h-5 w-5" />
              </div>
              <p className="text-xs font-bold text-neutral-800 mb-3">
                Drag and drop your proof here, or
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-lg border border-neutral-200 bg-white px-5 py-2 text-xs font-semibold text-neutral-600 shadow-xs hover:bg-neutral-50 transition-colors mb-3 cursor-pointer"
              >
                Choose file
              </button>
              {/* [LAMA] JPG or PNG max 3 MB */}
              <p className="text-[11px] text-neutral-400">JPG, PNG, or WEBP max 2 MB</p>
            </div>
          )}

          {/* [BARU] pesan error dari server */}
          {serverError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-[11px] font-semibold text-red-600">{serverError}</p>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            disabled={uploading} // [BARU]
            onClick={() => {
              handleRemoveFile();
              onClose();
            }}
            className="rounded-xl bg-[#1E293B] px-5 py-2.5 text-xs font-bold text-white hover:bg-neutral-800 transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            // [LAMA] disabled={!selectedFile || !!errorType}
            disabled={!selectedFile || !!errorType || uploading || !transaction}
            // [LAMA] onClick={() => { if (onSuccess) { onSuccess(); } handleRemoveFile(); onClose(); }}
            onClick={handleSubmit}
            className="rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-white hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {/* [LAMA] Send Proof */}
            {uploading ? "Uploading..." : "Send Proof"}
          </button>
        </div>
      </div>
    </div>
  );
}