import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="max-w-md mx-auto px-4 py-20 flex flex-col items-center justify-center text-center gap-4 min-h-screen">
      <h2 className="text-2xl font-bold text-gray-900">Event Tidak Ditemukan</h2>
      <p className="text-sm text-gray-600">
        Maaf, event yang kamu cari tidak tersedia atau sudah dihapus.
      </p>
      <Link
        href="/"
        className="mt-2 bg-[#f39c12] hover:bg-[#e08e0b] text-white font-semibold px-5 py-2.5 rounded-lg shadow transition"
      >
        Kembali ke Beranda
      </Link>
    </div>
  );
}