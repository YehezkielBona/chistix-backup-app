'use client';

import React, { useState, useEffect } from 'react';
// [LAMA] daftar dari data dummy. Nilainya ('Concert', 'North Jakarta, Jakarta')
// tidak cocok dengan data di database, jadi diganti EVENT_CATEGORIES & CITY_OPTIONS di bawah.
// import { CATEGORIES, LOCATIONS } from '@/data/events';

// [BARU] value = enum EventCategoryEnum di schema.prisma, label = teks di UI
const EVENT_CATEGORIES = [
  { value: 'MUSIC', label: 'Music' },
  { value: 'SEMINAR', label: 'Seminar' },
  { value: 'TALKSHOW', label: 'Talkshow' },
  { value: 'SPORTS', label: 'Sports' },
  { value: 'EXHIBITION', label: 'Exhibition' },
];

// [BARU] kota populer. Dicocokkan dengan "contains" di backend,
// jadi "Jakarta" juga cocok dengan "Kota Jakarta Selatan"
const CITY_OPTIONS = ['Jakarta', 'Bandung', 'Surabaya', 'Yogyakarta', 'Denpasar', 'Medan'];

interface SidebarPortalProps {
  onFilterChange: (filters: {
    category: string;
    location: string;
    minPrice?: number;
    maxPrice?: number;
  }) => void;
  onReset: () => void;
}

export default function SidebarPortal({ onFilterChange, onReset }: SidebarPortalProps) {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [priceError, setPriceError] = useState(''); // [BARU]

  // Daftar provinsi dari API Emsifa (diambil lewat Backend Express: GET /api/regions/provinces)
  const [emsifaProvinces, setEmsifaProvinces] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetch('/api/regions/provinces')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          setEmsifaProvinces(json.data);
        }
      })
      .catch(() => {
        // Fallback ke LOCATIONS statis jika offline
        // [BARU] sekarang fallback-nya CITY_OPTIONS
      });
  }, []);

  // Helper function untuk memfilter HANYA angka (mencegah titik, koma, minus, dll)
  const handlePriceChange = (value: string, setter: (val: string) => void) => {
    const cleanNumericValue = value.replace(/[^0-9]/g, '');
    setter(cleanNumericValue);
  };

  // Mencegah pengetikan simbol seperti '.', ',', 'e', '-', '+' dari keyboard
  const preventInvalidPriceInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (['.', ',', 'e', 'E', '-', '+'].includes(e.key)) {
      e.preventDefault();
    }
  };

  // Handler Tombol Save
  const handleSave = () => {
    // [BARU] harga minimum tidak boleh lebih besar dari maksimum
    if (minPrice && maxPrice && Number(minPrice) > Number(maxPrice)) {
      setPriceError('Harga minimum tidak boleh lebih besar dari harga maksimum');
      return;
    }
    setPriceError('');

    onFilterChange({
      category: selectedCategory,
      location: selectedLocation,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
    });
  };

  // Handler Tombol Reset
  const handleResetClick = () => {
    setSelectedCategory('');
    setSelectedLocation('');
    setMinPrice('');
    setMaxPrice('');
    setPriceError(''); // [BARU]
    onReset();
  };

  return (
    <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm space-y-4 w-full">
      {/* 1. Category */}
      <div className="space-y-1">
        <label className="block text-sm font-bold text-gray-800">
          Category
        </label>
        <div className="relative">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full appearance-none bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 focus:outline-none focus:border-amber-500 cursor-pointer pr-8 leading-tight"
          >
            <option value="">All Categories</option>
            {/* [LAMA]
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
            */}
            {/* [BARU] tampilkan label, kirim value enum ke backend */}
            {EVENT_CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m6 9 6 6 6-6"/>
            </svg>
          </div>
        </div>
      </div>

      {/* 2. Location (Terintegrasi API Emsifa via Express) */}
      <div className="space-y-1">
        <label className="block text-sm font-bold text-gray-800">
          Location
        </label>
        <div className="relative">
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="w-full appearance-none bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 focus:outline-none focus:border-amber-500 cursor-pointer pr-8 leading-tight"
          >
            <option value="">All Locations</option>
            {/* [LAMA]
            {LOCATIONS.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
            */}
            {/* [BARU] kota populer */}
            <optgroup label="Kota populer">
              {CITY_OPTIONS.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </optgroup>
            {emsifaProvinces.length > 0 && (
              <optgroup label="Provinsi (Emsifa Indonesia)">
                {emsifaProvinces.map((prov) => (
                  <option key={`prov-${prov.id}`} value={prov.name}>
                    {prov.name}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m6 9 6 6 6-6"/>
            </svg>
          </div>
        </div>
      </div>

      {/* 3. Price Range */}
      <div className="space-y-1.5">
        <label className="block text-sm font-bold text-gray-800">
          Price Range
        </label>
        <div className="space-y-1.5">
          <input
            type="text"
            inputMode="numeric"
            placeholder="Minimum Price"
            value={minPrice}
            onKeyDown={preventInvalidPriceInput}
            onChange={(e) => handlePriceChange(e.target.value, setMinPrice)}
            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-medium placeholder-gray-400 text-gray-700 focus:outline-none focus:border-amber-500"
          />
          <input
            type="text"
            inputMode="numeric"
            placeholder="Maximum Price"
            value={maxPrice}
            onKeyDown={preventInvalidPriceInput}
            onChange={(e) => handlePriceChange(e.target.value, setMaxPrice)}
            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-medium placeholder-gray-400 text-gray-700 focus:outline-none focus:border-amber-500"
          />
          {/* [BARU] pesan validasi harga */}
          {priceError && <p className="text-[11px] text-red-600">{priceError}</p>}
        </div>
      </div>

      {/* 4. Action Buttons (Reset & Save) */}
      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={handleResetClick}
          className="flex-1 py-1.5 border border-amber-500 text-amber-600 font-bold text-xs rounded-lg hover:bg-amber-50 transition cursor-pointer text-center"
        >
          Reset
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="flex-1 py-1.5 bg-[#FF8A00] hover:bg-[#E07B00] text-white font-bold text-xs rounded-lg transition cursor-pointer text-center shadow-sm"
        >
          Save
        </button>
      </div>
    </div>
  );
}