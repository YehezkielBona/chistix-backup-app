'use client';

import React, { useState } from 'react';
import Navbar from '@/components/menubar/navbar';
import Footer from '@/components/menubar/footer';
import SidebarPortal from '@/components/SidebarPortal';
import EventCard from '@/components/EventCard';
import { DUMMY_EVENTS } from '@/data/events';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function EventsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [minPrice, setMinPrice] = useState<number | undefined>();
  const [maxPrice, setMaxPrice] = useState<number | undefined>();
  const [sortOption, setSortOption] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Menerima filter dari SidebarPortal
  const handleFilterChange = (filters: {
    category: string;
    location: string;
    minPrice?: number;
    maxPrice?: number;
  }) => {
    setSelectedCategory(filters.category);
    setSelectedLocation(filters.location);
    setMinPrice(filters.minPrice);
    setMaxPrice(filters.maxPrice);
    setCurrentPage(1); // Kembalikan ke halaman pertama setiap kali filter berubah
  };

  const handleReset = () => {
    setSelectedCategory('');
    setSelectedLocation('');
    setMinPrice(undefined);
    setMaxPrice(undefined);
    setSearchQuery('');
    setSortOption('');
    setCurrentPage(1);
  };

  // Filter Data Event secara presisi (dengan Optional Chaining `?.` agar tidak error jika undefined)
  const filteredEvents = DUMMY_EVENTS.filter((event) => {
    const matchCategory = selectedCategory 
      ? event.category?.toLowerCase() === selectedCategory.toLowerCase() 
      : true;

    const matchLocation = selectedLocation 
      ? event.location?.toLowerCase().includes(selectedLocation.toLowerCase()) 
      : true;

    const matchSearch = searchQuery 
      ? event.title?.toLowerCase().includes(searchQuery.toLowerCase()) 
      : true;
    
    const matchMinPrice = minPrice !== undefined ? event.price >= minPrice : true;
    const matchMaxPrice = maxPrice !== undefined ? event.price <= maxPrice : true;

    return matchCategory && matchLocation && matchSearch && matchMinPrice && matchMaxPrice;
  });

  // Sorting Data
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    if (sortOption === 'latest') return new Date(b.date).getTime() - new Date(a.date).getTime();
    if (sortOption === 'popular') return (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0);
    if (sortOption === 'price-low') return a.price - b.price;
    if (sortOption === 'price-high') return b.price - a.price;
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(sortedEvents.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentEvents = sortedEvents.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col justify-between">
      {/* Header Navbar */}
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-8 w-full">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          
          {/* Sidebar Portal Kiri */}
          <aside className="w-full md:w-[240px] flex-shrink-0">
            <SidebarPortal 
              onFilterChange={handleFilterChange}
              onReset={handleReset}
            />
          </aside>

          {/* Konten Utama Kanan */}
          <div className="flex-1 w-full space-y-4">
            
            {/* 1. Bar Sort */}
            <div className="bg-white rounded-2xl px-5 py-3 border border-gray-200/80 shadow-sm flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-gray-800">Sort</span>
                
                <div className="relative">
                  <select 
                    value={sortOption}
                    onChange={(e) => {
                      setSortOption(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="appearance-none bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 focus:outline-none focus:border-amber-500 cursor-pointer pr-8 min-w-[160px] leading-tight"
                  >
                    <option value="">Select option</option>
                    <option value="latest">Newest</option>
                    <option value="popular">Most Popular</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                  </select>
                  
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m6 9 6 6 6-6"/>
                    </svg>
                  </div>
                </div>

              </div>
              
              {/* Teks "Total: X event" sudah dihapus dari sini */}
            </div>

            {/* 2. Kontainer Hasil Pencarian & Grid Card */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-sm space-y-5 w-full">
              
              <h2 className="text-sm font-bold text-gray-800">
                {searchQuery || selectedCategory || selectedLocation ? (
                  <>Berikut Hasil Pencarian <span className="font-extrabold text-amber-600">"{searchQuery || selectedCategory || selectedLocation}"</span></>
                ) : (
                  'Semua Event'
                )}
              </h2>

              {currentEvents.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 w-full">
                  {currentEvents.map((event) => (
                    <EventCard 
                      key={event.id}
                      variant="standard" 
                      event={event} 
                    />
                  ))}
                </div>
              ) : (
                <div className="py-16 text-center text-gray-400 text-sm">
                  Tidak ada event yang ditemukan sesuai filter yang dipilih.
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 pt-6 border-t border-gray-50">
                  <button 
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 transition ${
                      currentPage === 1 ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                    }`}
                  >
                    <ChevronLeft size={14} /> Previous
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`w-7 h-7 flex items-center justify-center rounded text-xs font-semibold transition cursor-pointer ${
                        currentPage === page 
                          ? 'border border-amber-500 text-amber-600 bg-amber-50/50' 
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  <button 
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 transition ${
                      currentPage === totalPages ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                    }`}
                  >
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              )}

            </div>

          </div>

        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}