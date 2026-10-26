"use client";

// ============================================================
// Halaman Edit Event (Dashboard Organizer)
// Terintegrasi dengan Backend Express (GET & PUT /api/organizer/events/:id),
// API Wilayah Emsifa, dan Cloudinary Signed Upload.
// Mendukung Toggle Aktif/Non-Aktif Kategori Tiket (VIP, Regular, Presale).
// ============================================================
import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SidebarDashboard from "@/components/sidebar/SidebarDashboard";
import Footer from "@/components/menubar/footer";
import {
  ChevronRightIcon,
  HomeIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { EventFormData } from "@/types/event";
import NavbarOrganizer from "@/components/menubar/navbarOrganizer";
import { uploadImageToCloudinary } from "@/lib/cloudinary";

interface RegionOption {
  id: string;
  name: string;
}

export default function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const eventId = resolvedParams.id;

  const [isLoading, setIsLoading] = useState(true);
  const [modalFeedback, setModalFeedback] = useState<{
    isOpen: boolean;
    type: "SUCCESS" | "ERROR";
    message: string;
  }>({ isOpen: false, type: "SUCCESS", message: "" });

  const [form, setForm] = useState<Partial<EventFormData>>({
    title: "",
    category: "Music",
    description: "",
    province: "",
    city: "",
    venueMaps: "",
    venueDetail: "",
    presale: { enabled: false, amount: 0, startDate: "", endDate: "" },
    thumbnailImage: "",
    coverImages: [],
    videoUrl: "",
    scheduledPublishStart: "",
    scheduledPublishEnd: "",
  });

  // State Emsifa Provinsi & Kota
  const [provinceId, setProvinceId] = useState<string>("");
  const [cityId, setCityId] = useState<string>("");
  const [provincesList, setProvincesList] = useState<RegionOption[]>([]);
  const [citiesList, setCitiesList] = useState<RegionOption[]>([]);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [totalTicket, setTotalTicket] = useState<number>(0);

  // State Toggle & Alokasi VIP
  const [isVipEnabled, setIsVipEnabled] = useState<boolean>(true);
  const [vipQuota, setVipQuota] = useState<number>(0);
  const [vipPrice, setVipPrice] = useState<number>(0);
  const [vipFinalPrice, setVipFinalPrice] = useState<number>(0);

  // State Toggle & Alokasi Regular
  const [isRegularEnabled, setIsRegularEnabled] = useState<boolean>(true);
  const [regularQuota, setRegularQuota] = useState<number>(0);
  const [regularPrice, setRegularPrice] = useState<number>(0);
  const [regularFinalPrice, setRegularFinalPrice] = useState<number>(0);

  // State Alokasi Presale
  const [presaleQuota, setPresaleQuota] = useState<number>(0);
  const [presalePrice, setPresalePrice] = useState<number>(0);
  const [presaleFinalPrice, setPresaleFinalPrice] = useState<number>(0);

  const [isUploadingThumb, setIsUploadingThumb] = useState(false);
  const [isUploadingCovers, setIsUploadingCovers] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(true);
  const [tierWarning, setTierWarning] = useState(false);

  // State untuk file lokal & preview sebelum di-upload saat Save Changes
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [thumbPreview, setThumbPreview] = useState<string>("");

  const [coverFilesList, setCoverFilesList] = useState<File[]>([]);
  const [coverPreviews, setCoverPreviews] = useState<string[]>([]);

  // Kalkulasi Kuota yang Hanya Menghitung Kategori Tiket yang Aktif
  const activeVipQuota = isVipEnabled ? vipQuota : 0;
  const activeRegularQuota = isRegularEnabled ? regularQuota : 0;
  const activePresaleQuota = form.presale?.enabled ? presaleQuota : 0;

  const allocatedQuota = activeVipQuota + activeRegularQuota + activePresaleQuota;
  const remainingQuota = totalTicket - allocatedQuota;
  const isQuotaExceeded =
    totalTicket <= 0 ||
    activeVipQuota > totalTicket ||
    activeRegularQuota > totalTicket ||
    (Boolean(form.presale?.enabled) && activePresaleQuota > totalTicket) ||
    allocatedQuota > totalTicket ||
    remainingQuota !== 0;

  // Rumus Matematika H-1: kurangi 24 jam x 60 menit x 60 detik x 1000 ms dari startDate
  const salesCloseDate = startDate
    ? new Date(new Date(startDate).getTime() - 24 * 60 * 60 * 1000)
    : null;

  const handleChange = (field: keyof EventFormData, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // 1. Muat Provinsi Emsifa
  useEffect(() => {
    fetch("/api/regions/provinces")
      .then((r) => r.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          setProvincesList(json.data);
        }
      })
      .catch((err) => console.error("Gagal memuat provinsi Emsifa:", err));
  }, []);

  // 2. Muat Kota Emsifa saat provinceId berubah
  useEffect(() => {
    if (!provinceId) {
      setCitiesList([]);
      return;
    }
    fetch(`/api/regions/cities/${provinceId}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          setCitiesList(json.data);
        }
      })
      .catch((err) => console.error("Gagal memuat kota Emsifa:", err));
  }, [provinceId]);

  // 3. Tarik Detail Event dari Backend Express
  useEffect(() => {
    const fetchEventDetail = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/organizer/events/${eventId}`);
        const json = await res.json();

        if (json.success && json.data) {
          const evt = json.data;

          const formatToDatetimeLocal = (dateString?: string) => {
            if (!dateString) return "";
            const d = new Date(dateString);
            if (isNaN(d.getTime())) return "";
            return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
              .toISOString()
              .slice(0, 16);
          };

          const catFormatted = evt.category
            ? evt.category.charAt(0).toUpperCase() + evt.category.slice(1).toLowerCase()
            : "Music";

          setForm({
            title: evt.title || "",
            category: catFormatted,
            description: evt.description || "",
            province: evt.provinceName || evt.province || "",
            city: evt.cityName || evt.city || "",
            venueMaps: evt.venueMaps || "",
            venueDetail: evt.venueDetail || "",
            thumbnailImage: evt.thumbnailImage || "",
            coverImages: evt.coverImages || [],
            videoUrl: evt.videoUrl || "",
            presale: evt.presale || {
              enabled: Boolean(evt.isPresale || evt.presaleQuota > 0),
              amount: Number(evt.presaleQuota || 0),
              startDate: evt.scheduledPublishStart
                ? String(evt.scheduledPublishStart).slice(0, 10)
                : "",
              endDate: evt.scheduledPublishEnd
                ? String(evt.scheduledPublishEnd).slice(0, 10)
                : "",
            },
          });

          setProvinceId(String(evt.provinceId || "31"));
          setCityId(String(evt.cityId || "3171"));

          setStartDate(formatToDatetimeLocal(evt.startDate));
          setEndDate(formatToDatetimeLocal(evt.endDate));
          setTotalTicket(Number(evt.totalQuotaTiket ?? evt.totalTicket ?? 0));

          // Atur Saklar Toggle VIP & Regular berdasarkan data di Database
          const loadedVipQuota = Number(evt.vipQuota ?? 0);
          const loadedRegularQuota = Number(evt.regularQuota ?? 0);

          setIsVipEnabled(loadedVipQuota > 0 || Boolean(evt.isVip));
          setIsRegularEnabled(loadedRegularQuota > 0 || Boolean(evt.isRegular));

          setVipQuota(loadedVipQuota);
          setVipPrice(Number(evt.vipPriceNormal ?? 0));
          setVipFinalPrice(Number(evt.vipPriceFinal ?? evt.vipPriceNormal ?? 0));

          setRegularQuota(loadedRegularQuota);
          setRegularPrice(Number(evt.regularPriceNormal ?? 0));
          setRegularFinalPrice(Number(evt.regularPriceFinal ?? evt.regularPriceNormal ?? 0));

          setPresaleQuota(Number(evt.presaleQuota ?? 0));
          setPresalePrice(Number(evt.presalePriceNormal ?? 0));
          setPresaleFinalPrice(Number(evt.presalePriceFinal ?? evt.presalePriceNormal ?? 0));
        }
      } catch (err) {
        console.error("Gagal load detail event:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (eventId) {
      fetchEventDetail();
    }
  }, [eventId]);

  const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setThumbFile(file);
    setThumbPreview(URL.createObjectURL(file));
    e.target.value = "";
  };

  const handleCoversSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setCoverFilesList(files);
    const previews = files.map((f) => URL.createObjectURL(f));
    setCoverPreviews(previews);
    e.target.value = "";
  };

  // 4. Submit Perubahan via HTTP PUT ke Express
  const handleSaveUpdate = async () => {
    if (!agreedToTerms) {
      setModalFeedback({
        isOpen: true,
        type: "ERROR",
        message: "Harap setujui Terms & Conditions terlebih dahulu!",
      });
      return;
    }

    const hasThumbnail = Boolean(form.thumbnailImage || thumbFile);
    const hasCovers = Boolean(
      (form.coverImages && form.coverImages.length > 0) || coverFilesList.length > 0,
    );

    if (
      !form.title ||
      !startDate ||
      !endDate ||
      !form.description ||
      !form.province ||
      !form.city ||
      !form.venueDetail ||
      !hasThumbnail ||
      !hasCovers
    ) {
      setModalFeedback({
        isOpen: true,
        type: "ERROR",
        message: "Harap lengkapi semua field yang wajib diisi, termasuk Thumbnail dan minimal 1 Cover Image!",
      });
      return;
    }

    if (totalTicket <= 0) {
      setModalFeedback({
        isOpen: true,
        type: "ERROR",
        message: "Total Ticket Amount harus lebih besar dari 0!",
      });
      return;
    }

    if (remainingQuota !== 0) {
      setModalFeedback({
        isOpen: true,
        type: "ERROR",
        message: `Alokasi kuota tiket belum pas! Sisa kuota: ${remainingQuota} tiket. Total pembagian tiket aktif harus tepat sama dengan ${totalTicket}!`,
      });
      return;
    }

    if (form.presale?.enabled && presaleQuota > 0) {
      if (!form.presale.startDate || !form.presale.endDate) {
        setModalFeedback({
          isOpen: true,
          type: "ERROR",
          message: "Harap tentukan tanggal mulai dan akhir periode Presale!",
        });
        return;
      }
      if (new Date(form.presale.endDate) <= new Date(form.presale.startDate)) {
        setModalFeedback({
          isOpen: true,
          type: "ERROR",
          message: "Tanggal berakhir Presale harus setelah tanggal mulai Presale!",
        });
        return;
      }
      if (salesCloseDate && new Date(form.presale.endDate) > salesCloseDate) {
        setModalFeedback({
          isOpen: true,
          type: "ERROR",
          message: `Periode Presale tidak boleh melebihi batas H-1 acara (${salesCloseDate.toLocaleDateString("id-ID")}) agar ada waktu untuk penjualan tiket VIP & Regular!`,
        });
        return;
      }
    }

    try {
      let finalThumbUrl = form.thumbnailImage;
      let finalCoverUrls = form.coverImages || [];

      // 1. Upload Thumbnail hanya jika ada file baru yang dipilih
      if (thumbFile) {
        setIsUploadingThumb(true);
        finalThumbUrl = await uploadImageToCloudinary(thumbFile, "chistix/thumbnails");
        setIsUploadingThumb(false);
      }

      // 2. Upload Covers hanya jika ada file baru yang dipilih
      if (coverFilesList.length > 0) {
        setIsUploadingCovers(true);
        const uploadedUrls: string[] = [];
        for (const file of coverFilesList) {
          const url = await uploadImageToCloudinary(file, "chistix/covers");
          uploadedUrls.push(url);
        }
        finalCoverUrls = uploadedUrls;
        setIsUploadingCovers(false);
      }

      if (!finalThumbUrl || finalCoverUrls.length === 0) {
        setModalFeedback({
          isOpen: true,
          type: "ERROR",
          message: "Harap pilih Thumbnail Image dan minimal 1 Cover Image!",
        });
        return;
      }

      const activePresale = Boolean(form.presale?.enabled) && presaleQuota > 0;
      const payload = {
        title: form.title,
        category: (form.category || "MUSIC").toUpperCase(),
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        description: form.description,

        provinceId: provinceId || "31",
        provinceName: form.province,
        cityId: cityId || "3171",
        cityName: form.city,

        venueDetail: form.venueDetail,
        venueMaps: form.venueMaps || "",
        totalQuotaTiket: Number(totalTicket),
        ticketType: activePresale ? "PRESALE" : isRegularEnabled ? "REGULAR" : "VIP",

        vipQuota: isVipEnabled ? Number(vipQuota) : 0,
        vipPriceNormal: isVipEnabled ? Number(vipPrice) : 0,
        vipPriceFinal: isVipEnabled ? Number(vipFinalPrice || vipPrice) : 0,

        regularQuota: isRegularEnabled ? Number(regularQuota) : 0,
        regularPriceNormal: isRegularEnabled ? Number(regularPrice) : 0,
        regularPriceFinal: isRegularEnabled ? Number(regularFinalPrice || regularPrice) : 0,

        presaleQuota: activePresale ? Number(presaleQuota) : 0,
        presalePriceNormal: activePresale ? Number(presalePrice || regularPrice) : 0,
        presalePriceFinal: activePresale
          ? Number(presaleFinalPrice || presalePrice || regularFinalPrice || regularPrice)
          : 0,

        thumbnailImage: finalThumbUrl,
        coverImages: finalCoverUrls,
        videoUrl: form.videoUrl || "",

        scheduledPublishStart: form.presale?.startDate || "",
        scheduledPublishEnd: form.presale?.endDate || "",
        isDraft: false,
      };

      const res = await fetch(`/api/organizer/events/${eventId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.message || "Gagal memperbarui event");
      }

      setModalFeedback({
        isOpen: true,
        type: "SUCCESS",
        message: "Perubahan event berhasil disimpan ke database Neon!",
      });
    } catch (err: any) {
      console.error(err);
      setModalFeedback({
        isOpen: true,
        type: "ERROR",
        message: err.message || "Terjadi kesalahan saat menyimpan event",
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F4] text-neutral-800 font-sans flex flex-col justify-between">
      <NavbarOrganizer user={null} />

      <div className="flex-1 w-full p-4 md:p-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-6 items-start">
          <SidebarDashboard />

          <div className="flex-1 w-full space-y-4">
            {/* Breadcrumb Nav */}
            <nav className="flex items-center gap-1.5 text-xs md:text-sm text-neutral-500">
              <Link
                href="/organizer/dashboard"
                className="flex items-center gap-1 hover:text-[#BB4D00] transition-colors font-medium"
              >
                <HomeIcon className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </Link>

              <ChevronRightIcon className="w-3.5 h-3.5 text-neutral-300" />

              <Link
                href="/organizer/dashboard/events"
                className="hover:text-[#BB4D00] transition-colors font-medium"
              >
                Events
              </Link>

              <ChevronRightIcon className="w-3.5 h-3.5 text-neutral-300" />

              <span className="text-neutral-900 font-semibold">Edit Event</span>
            </nav>

            {/* Card Form Edit */}
            <div className="bg-white rounded-2xl border border-neutral-100 shadow-xs overflow-hidden">
              {isLoading ? (
                <div className="p-16 text-center text-neutral-400 text-sm">
                  Memuat data event dari database Neon...
                </div>
              ) : (
                <>
                  <div className="p-6 md:p-8 space-y-5">
                    <div className="pb-3 border-b border-neutral-100">
                      <h1 className="text-xl font-bold text-neutral-900">Edit Event</h1>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        Perbarui rincian event dan alokasi tiket Anda
                      </p>
                    </div>

                    {/* Event Title */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-start">
                      <label className="text-sm font-medium text-neutral-700 pt-2.5">
                        Event Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Nama event..."
                        value={form.title}
                        onChange={(e) => handleChange("title", e.target.value)}
                        className="sm:col-span-2 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#BB4D00] bg-neutral-50"
                        required
                      />
                    </div>

                    {/* Event Category */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-start">
                      <label className="text-sm font-medium text-neutral-700 pt-2.5">
                        Event Category <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={form.category}
                        onChange={(e) => handleChange("category", e.target.value)}
                        className="sm:col-span-2 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#BB4D00] bg-neutral-50 cursor-pointer"
                      >
                        <option value="Music">Music</option>
                        <option value="Seminar">Seminar</option>
                        <option value="Talkshow">Talkshow</option>
                        <option value="Sports">Sports</option>
                        <option value="Exhibition">Exhibition</option>
                      </select>
                    </div>

                    {/* Jadwal Event */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-start">
                      <label className="text-sm font-medium text-neutral-700 pt-2.5">
                        Event Schedule <span className="text-red-500">*</span>
                      </label>
                      <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <span className="text-xs text-neutral-400 block mb-1">
                            Start Date & Time <span className="text-red-500">*</span>
                          </span>
                          <input
                            type="datetime-local"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#BB4D00] bg-neutral-50 cursor-pointer"
                            required
                          />
                        </div>
                        <div>
                          <span className="text-xs text-neutral-400 block mb-1">
                            End Date & Time <span className="text-red-500">*</span>
                          </span>
                          <input
                            type="datetime-local"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#BB4D00] bg-neutral-50 cursor-pointer"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-start">
                      <label className="text-sm font-medium text-neutral-700 pt-2.5">
                        Event Description <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        rows={4}
                        placeholder="Deskripsi lengkap event..."
                        value={form.description}
                        onChange={(e) => handleChange("description", e.target.value)}
                        className="sm:col-span-2 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#BB4D00] bg-neutral-50 resize-none"
                        required
                      />
                    </div>

                    {/* Province (Emsifa) */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-start">
                      <label className="text-sm font-medium text-neutral-700 pt-2.5">
                        Location Province <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={provinceId}
                        onChange={(e) => {
                          const selectedId = e.target.value;
                          const found = provincesList.find((p) => p.id === selectedId);
                          setProvinceId(selectedId);
                          handleChange("province", found?.name || "");
                          setCityId("");
                          handleChange("city", "");
                        }}
                        className="sm:col-span-2 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#BB4D00] bg-neutral-50 cursor-pointer"
                        required
                      >
                        <option value="">Select Province (Emsifa)</option>
                        {provincesList.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* City (Emsifa) */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-start">
                      <label className="text-sm font-medium text-neutral-700 pt-2.5">
                        Location City <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={cityId}
                        onChange={(e) => {
                          const selectedId = e.target.value;
                          const found = citiesList.find((c) => c.id === selectedId);
                          setCityId(selectedId);
                          handleChange("city", found?.name || "");
                        }}
                        disabled={!provinceId}
                        className="sm:col-span-2 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#BB4D00] bg-neutral-50 disabled:opacity-50 cursor-pointer"
                        required
                      >
                        <option value="">Select City / Regency</option>
                        {citiesList.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Venue Location Maps */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-start">
                      <label className="text-sm font-medium text-neutral-700 pt-2.5">
                        Venue Location Maps <span className="text-xs text-neutral-400 font-normal">(Optional)</span>
                      </label>
                      <input
                        type="url"
                        placeholder="https://maps.google.com/..."
                        value={form.venueMaps}
                        onChange={(e) => handleChange("venueMaps", e.target.value)}
                        className="sm:col-span-2 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#BB4D00] bg-neutral-50"
                      />
                    </div>

                    {/* Venue Detail */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-start">
                      <label className="text-sm font-medium text-neutral-700 pt-2.5">
                        Venue Location Detail <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Nama gedung, jalan, detail lokasi..."
                        value={form.venueDetail}
                        onChange={(e) => handleChange("venueDetail", e.target.value)}
                        className="sm:col-span-2 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#BB4D00] bg-neutral-50"
                        required
                      />
                    </div>

                    {/* Total Ticket Amount */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-center">
                      <label className="text-sm font-medium text-neutral-700">
                        Total Ticket Amount <span className="text-red-500">*</span>
                      </label>
                      <div className="sm:col-span-2 flex items-center gap-3">
                        <input
                          type="number"
                          min={1}
                          placeholder="Contoh: 500"
                          value={totalTicket || ""}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setTotalTicket(val);
                            if (val > 0) {
                              setTierWarning(false);
                            }
                            setVipQuota(0);
                            setRegularQuota(0);
                            setPresaleQuota(0);
                          }}
                          className="w-36 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#BB4D00] bg-neutral-50 font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          required
                        />
                        <span
                          className={`text-xs font-semibold px-3 py-1.5 rounded-full ${
                            totalTicket === 0
                              ? "bg-neutral-100 text-neutral-500"
                              : remainingQuota === 0
                              ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                              : remainingQuota < 0
                              ? "bg-rose-100 text-rose-700 border border-rose-200"
                              : "bg-amber-100 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {totalTicket === 0
                            ? "Isi total kuota dahulu"
                            : remainingQuota === 0
                            ? "Kuota pas terbagi!"
                            : remainingQuota < 0
                            ? `Kelebihan ${Math.abs(remainingQuota)} tiket!`
                            : `Sisa Kuota: ${remainingQuota} tiket`}
                        </span>
                      </div>
                    </div>

                    {tierWarning && (!totalTicket || totalTicket <= 0) && (
                      <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-semibold animate-pulse">
                        <span>You must fill the Total Ticket Amount, before you fill the Ticket Tier</span>
                      </div>
                    )}

                    <div className="border-t border-neutral-100 pt-2" />

                    {/* TICKET TIERS WRAPPER */}
                    <div className={`relative space-y-4 ${!totalTicket || totalTicket <= 0 ? "opacity-60" : ""}`}>
                      {(!totalTicket || totalTicket <= 0) && (
                        <div
                          onClick={() => setTierWarning(true)}
                          className="absolute inset-0 z-20 cursor-not-allowed bg-transparent"
                          title="You must fill the Total Ticket Amount, before you fill the Ticket Tier"
                        />
                      )}

                      {/* 3. VIP TIER DENGAN TOGGLE */}
                    <div className="space-y-3 p-4 rounded-xl border border-neutral-200/80 bg-neutral-50/50">
                      <div className="flex items-center justify-between">
                        <div className="pl-2">
                          <span className="text-sm font-bold text-neutral-800">VIP Ticket</span>
                          <p className="text-xs text-neutral-400">Aktifkan jika event menyediakan tiket kategori VIP</p>
                        </div>

                        {/* Tombol Toggle Saklar VIP */}
                        <button
                          type="button"
                          disabled={!totalTicket || totalTicket <= 0}
                          onClick={() => {
                            const nextState = !isVipEnabled;
                            setIsVipEnabled(nextState);
                            if (!nextState) {
                              setVipQuota(0);
                              setVipPrice(0);
                              setVipFinalPrice(0);
                            }
                          }}
                          className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ${
                            isVipEnabled ? "bg-[#EA580C]" : "bg-neutral-300"
                          }`}
                        >
                          <div
                            className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                              isVipEnabled ? "translate-x-5" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>

                      {/* Form Input VIP (Hanya Tampil Jika Toggle Aktif) */}
                      {isVipEnabled && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-center pt-3 border-t border-neutral-200/60">
                          <label className="text-xs font-semibold text-neutral-600 pl-2">Alokasi & Harga VIP</label>
                          <div className="sm:col-span-2 flex flex-wrap gap-2.5 items-center text-xs text-neutral-500">
                            <input
                              type="number"
                              min={0}
                              max={vipQuota + remainingQuota}
                              disabled={!totalTicket || totalTicket <= 0}
                              onWheel={(e) => e.currentTarget.blur()}
                              placeholder="Quota"
                              value={vipQuota || ""}
                              onChange={(e) => setVipQuota(Number(e.target.value))}
                              className="w-20 border border-neutral-200 rounded-lg px-2.5 py-2 focus:outline-none focus:border-[#BB4D00] bg-white text-sm font-semibold text-neutral-900"
                              required
                            />
                            <span>Normal Price</span>
                            <div className="relative flex items-center">
                              <span className="absolute left-2.5 text-xs text-neutral-400 font-semibold">IDR</span>
                              <input
                                type="number"
                                min={0}
                                disabled={!totalTicket || totalTicket <= 0}
                                onWheel={(e) => e.currentTarget.blur()}
                                placeholder="0"
                                value={vipPrice || ""}
                                onChange={(e) => setVipPrice(Number(e.target.value))}
                                className="w-32 border border-neutral-200 rounded-lg pl-10 pr-2.5 py-2 focus:outline-none focus:border-[#BB4D00] bg-white text-sm"
                                required
                              />
                            </div>
                            <span>Final Price</span>
                            <div className="relative flex items-center">
                              <span className="absolute left-2.5 text-xs text-neutral-400 font-semibold">IDR</span>
                              <input
                                type="number"
                                min={0}
                                disabled={!totalTicket || totalTicket <= 0}
                                onWheel={(e) => e.currentTarget.blur()}
                                placeholder="0"
                                value={vipFinalPrice || ""}
                                onChange={(e) => setVipFinalPrice(Number(e.target.value))}
                                className="w-32 border border-neutral-200 rounded-lg pl-10 pr-2.5 py-2 focus:outline-none focus:border-[#BB4D00] bg-white text-sm"
                                required
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 4. REGULAR TIER DENGAN TOGGLE */}
                    <div className="space-y-3 p-4 rounded-xl border border-neutral-200/80 bg-neutral-50/50">
                      <div className="flex items-center justify-between">
                        <div className="pl-2">
                          <span className="text-sm font-bold text-neutral-800">Regular Ticket</span>
                          <p className="text-xs text-neutral-400">Tiket standar umum untuk penonton</p>
                        </div>

                        {/* Tombol Toggle Saklar Regular */}
                        <button
                          type="button"
                          disabled={!totalTicket || totalTicket <= 0}
                          onClick={() => {
                            const nextState = !isRegularEnabled;
                            setIsRegularEnabled(nextState);
                            if (!nextState) {
                              setRegularQuota(0);
                              setRegularPrice(0);
                              setRegularFinalPrice(0);
                            }
                          }}
                          className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ${
                            isRegularEnabled ? "bg-[#EA580C]" : "bg-neutral-300"
                          }`}
                        >
                          <div
                            className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                              isRegularEnabled ? "translate-x-5" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>

                      {/* Form Input Regular (Hanya Tampil Jika Toggle Aktif) */}
                      {isRegularEnabled && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-center pt-3 border-t border-neutral-200/60">
                          <label className="text-xs font-semibold text-neutral-600 pl-2">Alokasi & Harga Regular</label>
                          <div className="sm:col-span-2 flex flex-wrap gap-2.5 items-center text-xs text-neutral-500">
                            <input
                              type="number"
                              min={0}
                              max={regularQuota + remainingQuota}
                              disabled={!totalTicket || totalTicket <= 0}
                              onWheel={(e) => e.currentTarget.blur()}
                              placeholder="Quota"
                              value={regularQuota || ""}
                              onChange={(e) => setRegularQuota(Number(e.target.value))}
                              className="w-20 border border-neutral-200 rounded-lg px-2.5 py-2 focus:outline-none focus:border-[#BB4D00] bg-white text-sm font-semibold text-neutral-900"
                              required
                            />
                            <span>Normal Price</span>
                            <div className="relative flex items-center">
                              <span className="absolute left-2.5 text-xs text-neutral-400 font-semibold">IDR</span>
                              <input
                                type="number"
                                min={0}
                                disabled={!totalTicket || totalTicket <= 0}
                                onWheel={(e) => e.currentTarget.blur()}
                                placeholder="0"
                                value={regularPrice || ""}
                                onChange={(e) => setRegularPrice(Number(e.target.value))}
                                className="w-32 border border-neutral-200 rounded-lg pl-10 pr-2.5 py-2 focus:outline-none focus:border-[#BB4D00] bg-white text-sm"
                                required
                              />
                            </div>
                            <span>Final Price</span>
                            <div className="relative flex items-center">
                              <span className="absolute left-2.5 text-xs text-neutral-400 font-semibold">IDR</span>
                              <input
                                type="number"
                                min={0}
                                disabled={!totalTicket || totalTicket <= 0}
                                onWheel={(e) => e.currentTarget.blur()}
                                placeholder="0"
                                value={regularFinalPrice || ""}
                                onChange={(e) => setRegularFinalPrice(Number(e.target.value))}
                                className="w-32 border border-neutral-200 rounded-lg pl-10 pr-2.5 py-2 focus:outline-none focus:border-[#BB4D00] bg-white text-sm"
                                required
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Panel Informasi Jadwal Penjualan VIP & Regular */}
                    <div className="ml-4 p-4 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-600 space-y-1.5">
                      <p className="font-semibold text-neutral-900">
                        Jadwal Pembukaan & Penutupan Tiket:
                      </p>
                      <p>
                        {form.presale?.enabled && form.presale?.endDate
                          ? `Tiket VIP & Regular akan dibuka otomatis setelah masa Presale berakhir pada tanggal ${new Date(form.presale.endDate).toLocaleDateString("id-ID")}.`
                          : "Tiket VIP & Regular langsung dibuka untuk umum saat event dipublikasikan."}
                      </p>
                      {salesCloseDate ? (
                        <p className="text-neutral-500">
                          Batas akhir seluruh penjualan tiket: H-1 sebelum event dimulai ({salesCloseDate.toLocaleDateString("id-ID")}, pukul {salesCloseDate.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB).
                        </p>
                      ) : (
                        <p className="text-neutral-400">
                          Tentukan Start Date acara di atas untuk melihat batas akhir H-1 penjualan tiket.
                        </p>
                      )}
                    </div>

                    {/* Presale Toggle */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-center">
                      <label className="text-sm font-medium text-neutral-700 pl-4">
                        Presale Ticket
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={!totalTicket || totalTicket <= 0}
                          onClick={() => {
                            if (!totalTicket || totalTicket <= 0) {
                              setTierWarning(true);
                              return;
                            }
                            const nextState = !form.presale?.enabled;
                            handleChange("presale", {
                              ...form.presale,
                              enabled: nextState,
                            });
                            if (!nextState) {
                              setPresaleQuota(0);
                              setPresalePrice(0);
                              setPresaleFinalPrice(0);
                            }
                          }}
                          className={`relative w-10 h-6 rounded-full transition-colors ${
                            !totalTicket || totalTicket <= 0
                              ? "opacity-50 cursor-not-allowed bg-neutral-200"
                              : form.presale?.enabled
                              ? "bg-[#EA580C] cursor-pointer"
                              : "bg-neutral-200 cursor-pointer"
                          }`}
                        >
                          <span
                            className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${
                              form.presale?.enabled ? "left-4.5" : "left-0.5"
                            }`}
                          />
                        </button>
                        <span className="text-xs text-neutral-500 font-medium">
                          {form.presale?.enabled ? "Aktif" : "Tidak Aktif"}
                        </span>
                      </div>
                    </div>

                    {/* Presale Form */}
                    {form.presale?.enabled && (
                      <div className="ml-4 space-y-4 p-4 bg-orange-50/40 border border-orange-200 rounded-xl">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                          <label className="text-xs font-semibold text-neutral-700">
                            Presale Quota & Price
                          </label>
                          <div className="sm:col-span-2 flex flex-wrap gap-2.5 items-center text-xs text-neutral-500">
                            <input
                              type="number"
                              min={0}
                              max={presaleQuota + remainingQuota}
                              disabled={totalTicket <= 0}
                              placeholder="Quota"
                              value={presaleQuota || ""}
                              onChange={(e) => setPresaleQuota(Number(e.target.value))}
                              className="w-20 border border-neutral-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#BB4D00] bg-white font-semibold"
                            />
                            <span>Normal</span>
                            <input
                              type="number"
                              min={0}
                              placeholder="Normal IDR"
                              value={presalePrice || ""}
                              onChange={(e) => setPresalePrice(Number(e.target.value))}
                              className="w-28 border border-neutral-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#BB4D00] bg-white"
                            />
                            <span>Final</span>
                            <input
                              type="number"
                              min={0}
                              placeholder="Final IDR"
                              value={presaleFinalPrice || ""}
                              onChange={(e) => setPresaleFinalPrice(Number(e.target.value))}
                              className="w-28 border border-neutral-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#BB4D00] bg-white"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 items-center">
                          <label className="text-xs font-semibold text-neutral-700">
                            Presale Period
                          </label>
                          <div className="col-span-2 flex items-center gap-2 text-xs text-neutral-500">
                            <input
                              type="date"
                              value={form.presale?.startDate}
                              onChange={(e) =>
                                handleChange("presale", {
                                  ...form.presale,
                                  startDate: e.target.value,
                                  endDate: form.presale?.endDate || "",
                                  enabled: true,
                                })
                              }
                              className="border border-neutral-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-[#BB4D00] bg-white"
                            />
                            <span>until</span>
                            <input
                              type="date"
                              value={form.presale?.endDate}
                              max={salesCloseDate ? salesCloseDate.toISOString().slice(0, 10) : undefined}
                              onChange={(e) =>
                                handleChange("presale", {
                                  ...form.presale,
                                  endDate: e.target.value,
                                  startDate: form.presale?.startDate || "",
                                  enabled: true,
                                })
                              }
                              className="border border-neutral-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-[#BB4D00] bg-white"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  {/* End TICKET TIERS WRAPPER */}

                    {/* Thumbnail Image (Cloudinary) */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-start">
                      <label className="text-sm font-medium text-neutral-700">
                        Thumbnail Image <span className="text-red-500">*</span>
                      </label>
                      <div className="sm:col-span-2 space-y-2">
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png,.webp"
                          onChange={handleThumbnailSelect}
                          className="text-sm text-neutral-600 file:mr-3 file:py-1.5 file:px-4 file:rounded-lg file:border file:border-neutral-200 file:text-xs file:font-semibold file:bg-neutral-50 file:text-neutral-700 hover:file:bg-neutral-100 file:cursor-pointer cursor-pointer"
                        />
                        {isUploadingThumb && (
                          <p className="text-xs text-amber-600 font-medium">
                            Mengunggah thumbnail ke Cloudinary...
                          </p>
                        )}
                        {(thumbPreview || form.thumbnailImage) && (
                          <div className="mt-2 flex items-center gap-3">
                            <img
                              src={thumbPreview || form.thumbnailImage}
                              alt="Thumbnail Preview"
                              className="w-20 h-20 object-cover rounded-xl border border-neutral-200 shadow-xs"
                            />
                            <div>
                              <p className="text-xs text-neutral-700 font-medium">
                                {thumbFile ? thumbFile.name : "Gambar saat ini dari database"}
                              </p>
                              {thumbFile && (
                                <span className="text-[10px] text-amber-600 font-medium">
                                  (Akan diunggah ke Cloudinary saat Save Changes)
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                        <p className="text-xs text-neutral-400">1:1 Aspect Ratio (Cloudinary Hosting)</p>
                      </div>
                    </div>

                    {/* Cover Images (Cloudinary) */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-start">
                      <label className="text-sm font-medium text-neutral-700">
                        Images Cover <span className="text-red-500">*</span>
                      </label>
                      <div className="sm:col-span-2 space-y-2">
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png,.webp"
                          multiple
                          onChange={handleCoversSelect}
                          className="text-sm text-neutral-600 file:mr-3 file:py-1.5 file:px-4 file:rounded-lg file:border file:border-neutral-200 file:text-xs file:font-semibold file:bg-neutral-50 file:text-neutral-700 hover:file:bg-neutral-100 file:cursor-pointer cursor-pointer"
                        />
                        {isUploadingCovers && (
                          <p className="text-xs text-amber-600 font-medium">
                            Mengunggah cover ke Cloudinary...
                          </p>
                        )}
                        {coverPreviews.length > 0 ? (
                          <div className="space-y-1">
                            <div className="flex gap-2 flex-wrap mt-2">
                              {coverPreviews.map((src, i) => (
                                <img
                                  key={i}
                                  src={src}
                                  alt={`Cover Preview ${i + 1}`}
                                  className="w-24 h-14 object-cover rounded-lg border border-neutral-200 shadow-xs"
                                />
                              ))}
                            </div>
                            <span className="text-[10px] text-amber-600 font-medium block">
                              ({coverFilesList.length} gambar baru akan diunggah ke Cloudinary saat Save Changes)
                            </span>
                          </div>
                        ) : form.coverImages && form.coverImages.length > 0 ? (
                          <div className="space-y-1">
                            <div className="flex gap-2 flex-wrap mt-2">
                              {form.coverImages.map((src, i) => (
                                <img
                                  key={i}
                                  src={src}
                                  alt={`Cover Saat Ini ${i + 1}`}
                                  className="w-24 h-14 object-cover rounded-lg border border-neutral-200 shadow-xs"
                                />
                              ))}
                            </div>
                            <span className="text-[10px] text-neutral-500 font-medium block">
                              ({form.coverImages.length} gambar cover saat ini dari database)
                            </span>
                          </div>
                        ) : null}
                        <p className="text-xs text-neutral-400">2:1 Aspect Ratio (Cloudinary Hosting)</p>
                      </div>
                    </div>

                    {/* Video URL (Opsional / Teaser Trailer) */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-start">
                      <label className="text-sm font-medium text-neutral-700 pt-2.5">
                        Video URL / Teaser <span className="text-xs text-neutral-400 font-normal">(Optional)</span>
                      </label>
                      <div className="sm:col-span-2 space-y-1.5">
                        <input
                          type="url"
                          placeholder="https://www.youtube.com/watch?v=... atau link video MP4"
                          value={form.videoUrl || ""}
                          onChange={(e) => handleChange("videoUrl", e.target.value)}
                          className="w-full border border-neutral-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#BB4D00] bg-neutral-50"
                        />
                        <p className="text-xs text-neutral-400">
                          Masukkan link YouTube trailer event atau video promosi (opsional).
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Action Bar */}
                  <div className="border-t border-neutral-100 bg-neutral-50/50 px-6 md:px-8 py-5">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="checkbox"
                            id="terms"
                            checked={agreedToTerms}
                            onChange={(e) => setAgreedToTerms(e.target.checked)}
                            className="rounded cursor-pointer"
                          />
                          <label htmlFor="terms" className="text-xs text-neutral-600 cursor-pointer">
                            Confirm update terms & conditions
                          </label>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <Link
                          href="/organizer/dashboard/events"
                          className="px-5 py-2.5 rounded-full text-sm font-semibold text-neutral-700 border border-neutral-200 hover:bg-neutral-100 transition-colors"
                        >
                          Cancel
                        </Link>
                        <button
                          type="button"
                          onClick={handleSaveUpdate}
                          disabled={isUploadingThumb || isUploadingCovers || isQuotaExceeded || !agreedToTerms}
                          className="px-6 py-2.5 rounded-full text-sm font-semibold text-white bg-[#EA580C] hover:bg-[#BB4D00] transition-colors cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* POP-UP FEEDBACK MODAL */}
      {modalFeedback.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-neutral-100 text-center space-y-4">
            <div
              className={`w-14 h-14 rounded-full mx-auto flex items-center justify-center ${
                modalFeedback.type === "SUCCESS"
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-rose-50 text-rose-600"
              }`}
            >
              {modalFeedback.type === "SUCCESS" ? (
                <CheckCircleIcon className="w-8 h-8" />
              ) : (
                <ExclamationTriangleIcon className="w-8 h-8" />
              )}
            </div>

            <div>
              <h3 className="text-lg font-bold text-neutral-900">
                {modalFeedback.type === "SUCCESS" ? "Berhasil Diperbarui!" : "Pemberitahuan"}
              </h3>
              <p className="text-xs md:text-sm text-neutral-600 mt-1">{modalFeedback.message}</p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setModalFeedback({ ...modalFeedback, isOpen: false });
                  if (modalFeedback.type === "SUCCESS") {
                    router.push("/organizer/dashboard/events");
                  }
                }}
                className={`w-full py-2.5 rounded-full text-sm font-semibold text-white transition-all cursor-pointer shadow-xs ${
                  modalFeedback.type === "SUCCESS"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-neutral-800 hover:bg-neutral-900"
                }`}
              >
                {modalFeedback.type === "SUCCESS" ? "Kembali ke Events" : "Tutup"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
