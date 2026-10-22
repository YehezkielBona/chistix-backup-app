'use client';

import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 pt-6 border-t border-gray-100">
      <button
        onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
        disabled={currentPage === 1}
        className="px-3 py-1 text-xs font-medium text-gray-600 hover:text-black disabled:opacity-40 disabled:cursor-not-allowed"
      >
        &lsaquo; Previous
      </button>

      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`w-7 h-7 text-xs font-medium rounded-md transition-colors ${
            currentPage === page
              ? 'border border-gray-300 bg-white text-black shadow-xs'
              : 'text-gray-500 hover:bg-gray-100'
          }`}
        >
          {page}
        </button>
      ))}

      <button
        onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
        disabled={currentPage === totalPages}
        className="px-3 py-1 text-xs font-medium text-gray-600 hover:text-black disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Next &rsaquo;
      </button>
    </div>
  );
}