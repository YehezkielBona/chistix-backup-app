import React from "react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, totalItems, itemsPerPage, onPageChange }: PaginationProps) {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-6 text-xs md:text-sm text-neutral-500">
      <p>
        Showing{" "}
        <span className="font-medium text-neutral-700">
          {startItem} - {endItem}
        </span>{" "}
        of <span className="font-medium text-neutral-700">{totalItems}</span>
      </p>

      <div className="flex items-center gap-1.5">
        <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="px-2.5 py-1 rounded text-neutral-600 hover:text-neutral-900 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
          Previous
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
          <button
            key={pageNum}
            onClick={() => onPageChange(pageNum)}
            className={`w-7 h-7 flex items-center justify-center rounded text-xs transition-colors cursor-pointer ${
              currentPage === pageNum ? "font-bold text-[#BB4D00] bg-[#FFF5ED] border border-[#BB4D00]/30" : "text-neutral-600 hover:bg-neutral-100"
            }`}
          >
            {pageNum}
          </button>
        ))}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || totalPages === 0}
          className="px-2.5 py-1 rounded text-neutral-600 hover:text-neutral-900 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          Next
        </button>
      </div>
    </div>
  );
}
