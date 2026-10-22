// ============================================================
// Region Service: Mengambil data Provinsi & Kota/Kabupaten Indonesia
// dari API publik Emsifa (EMSIFA_BASE_URL di .env).
// Dilengkapi cache di memori agar tidak perlu fetch berulang-ulang.
// ============================================================
import { env } from "../config/env.js";

export interface RegionItem {
  id: string;
  name: string;
  province_id?: string;
}

let provincesCache: RegionItem[] | null = null;
const citiesCache = new Map<string, RegionItem[]>();

// Ubah "DKI JAKARTA" -> "DKI Jakarta", "KOTA BANDUNG" -> "Kota Bandung" agar rapi di UI
function toTitleCase(name: string): string {
  const upperKeep = new Set(["DKI", "DI", "DIY"]);
  return name
    .trim()
    .split(/\s+/)
    .map((word) => {
      const upper = word.toUpperCase();
      if (upperKeep.has(upper)) return upper;
      return upper.charAt(0) + upper.slice(1).toLowerCase();
    })
    .join(" ");
}

export async function getProvincesService(): Promise<RegionItem[]> {
  if (provincesCache) return provincesCache;

  const url = `${env.EMSIFA_BASE_URL}/provinces.json`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Gagal mengambil data provinsi dari Emsifa (${res.status})`);
  }

  const raw = (await res.json()) as RegionItem[];
  provincesCache = raw.map((p) => ({
    id: String(p.id),
    name: toTitleCase(p.name),
  }));

  return provincesCache;
}

export async function getCitiesByProvinceService(provinceId: string): Promise<RegionItem[]> {
  const cached = citiesCache.get(provinceId);
  if (cached) return cached;

  const url = `${env.EMSIFA_BASE_URL}/regencies/${encodeURIComponent(provinceId)}.json`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Gagal mengambil data kota dari Emsifa (${res.status})`);
  }

  const raw = (await res.json()) as RegionItem[];
  const formatted = raw.map((c) => ({
    id: String(c.id),
    province_id: String(c.province_id ?? provinceId),
    name: toTitleCase(c.name),
  }));

  citiesCache.set(provinceId, formatted);
  return formatted;
}
