// Helper memanggil API backend dari frontend.
// Pesan error yang ditampilkan ke user selalu diambil dari server.
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  // Kalau body berupa FormData (upload file), Content-Type diisi browser
  const isForm = init.body instanceof FormData;

  const res = await fetch(path, {
    credentials: "include",
    ...init,
    headers: isForm
      ? init.headers
      : { "Content-Type": "application/json", ...init.headers },
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok || json.success === false) {
    if (res.status === 401 && typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new Error(json.message || "Terjadi kesalahan, coba lagi");
  }
  return json as T;
}

// Buang parameter kosong, karena backend menolak ?category=
export function buildQuery(params: Record<string, string | number | undefined | null>) {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      qs.set(key, String(value));
    }
  }
  const s = qs.toString();
  return s ? `?${s}` : "";
}