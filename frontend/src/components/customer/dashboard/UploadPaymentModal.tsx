"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, AlertCircle, Image as ImageIcon } from "lucide-react";

interface UploadPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UploadPaymentModal({ isOpen, onClose }: UploadPaymentModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorType, setErrorType] = useState<"invalid_type" | "too_large" | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const validateAndSetFile = (file: File) => {
    setErrorType(null);
    setSelectedFile(null);

    const validTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      setSelectedFile(file);
      setErrorType("invalid_type");
      return;
    }

    const maxSizeInBytes = 3 * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-[500px] overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
        <h2 className="text-base font-bold text-neutral-900 mb-4">Upload Payment Proof</h2>

        <div className="rounded-2xl bg-neutral-100/70 p-4 mb-5 text-xs">
          <div className="flex items-center justify-between font-bold text-neutral-900 mb-2">
            <span>Resonance Soundfest 2026: Intimate Live Performance</span>
            <span className="text-red-500 text-[11px] font-semibold">01: 59: 59</span>
          </div>

          <div className="space-y-1.5 text-neutral-600">
            <div className="flex justify-between">
              <span>Order</span>
              <span className="font-semibold text-neutral-800">#TRX-1030</span>
            </div>
            <div className="flex justify-between">
              <span>Ticket</span>
              <span className="font-semibold text-neutral-800">Presale VIP x 1</span>
            </div>
            <div className="flex justify-between pt-1 font-bold text-neutral-900">
              <span>Total Pay</span>
              <span>Rp. 430.000.00</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-neutral-900 block">Proof of payment</label>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/jpeg, image/png"
            className="hidden"
          />

          {errorType ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-red-100 bg-red-50/80 p-6 text-center">
              <AlertCircle className="h-7 w-7 text-red-500 mb-2" />
              <p className="text-xs font-bold text-red-600 mb-1">
                {errorType === "invalid_type"
                  ? "Only JPG or PNG files are allowed"
                  : "File is to large. The maximum size is 3MB"}
              </p>
              <p className="text-[11px] text-neutral-600 mb-4">{selectedFile?.name}</p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-xs font-semibold text-neutral-700 shadow-xs hover:bg-neutral-50 transition-colors"
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
                  className="rounded-md bg-red-100/80 px-2.5 py-1 text-[10px] font-semibold text-neutral-700 hover:bg-red-200/80 transition-colors"
                >
                  Remove
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const url = URL.createObjectURL(selectedFile);
                    window.open(url, "_blank");
                  }}
                  className="rounded-md border border-neutral-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-neutral-600 hover:bg-neutral-50 transition-colors"
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
              className={`flex flex-col items-center justify-center rounded-2xl border border-neutral-200 bg-neutral-100/60 p-8 text-center transition-colors ${
                isDragging ? "border-amber-500 bg-amber-50/50" : ""
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
                className="rounded-lg border border-neutral-200 bg-white px-5 py-2 text-xs font-semibold text-neutral-600 shadow-xs hover:bg-neutral-50 transition-colors mb-3"
              >
                Choose file
              </button>
              <p className="text-[11px] text-neutral-400">JPG or PNG max 3 MB</p>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => {
              handleRemoveFile();
              onClose();
            }}
            className="rounded-xl bg-[#1E293B] px-5 py-2.5 text-xs font-bold text-white hover:bg-neutral-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!selectedFile || !!errorType}
            onClick={() => {
              alert("Proof uploaded successfully!");
              handleRemoveFile();
              onClose();
            }}
            className="rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-white hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send Proof
          </button>
        </div>
      </div>
    </div>
  );
}