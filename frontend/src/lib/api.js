// Content API client.
//
// The dua/surah JSON is bundled into the build, so in production we read it
// straight from the bundle: it serves instantly from the CDN and the site never
// depends on the backend being awake (a sleeping free-tier server would
// otherwise stall the first page load). In development we still hit the local
// Express API so data edits show up without a rebuild.
import duasLocal from "../data/dua.json";
import surahsLocal from "../data/surah.json";

const USE_API = import.meta.env.DEV;

// Base URL for the admin-only backend (video render / download). Empty in dev,
// where Vite proxies /api to localhost:4000. Set VITE_API_BASE in production.
export const API_BASE = import.meta.env.VITE_API_BASE || "";
export const adminUrl = (path) => `${API_BASE}${path}`;

async function tryFetch(url) {
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return res.json();
}

export async function getDuas() {
  if (!USE_API) return duasLocal;
  try {
    return await tryFetch("/api/duas");
  } catch {
    return duasLocal;
  }
}

export async function getSurahs() {
  if (!USE_API) return surahsLocal;
  try {
    return await tryFetch("/api/surahs");
  } catch {
    return surahsLocal;
  }
}

export async function getDua(id) {
  const local = () => duasLocal.find((d) => d.id === id) || null;
  if (!USE_API) return local();
  try {
    return await tryFetch(`/api/duas/${id}`);
  } catch {
    return local();
  }
}

export async function getSurah(number) {
  const local = () => surahsLocal.find((s) => String(s.number) === String(number)) || null;
  if (!USE_API) return local();
  try {
    return await tryFetch(`/api/surahs/${number}`);
  } catch {
    return local();
  }
}
