// Keeps <title>, the meta description and the canonical URL correct as the user
// navigates the SPA. The initial HTML is prerendered at build time (see
// scripts/prerender.mjs); this only handles client-side route changes.
const SITE = "https://noorlyapp.vercel.app";

function setMeta(selector, attr, value) {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement("meta");
    const [, key, name] = selector.match(/\[(\w+)="([^"]+)"\]/) || [];
    if (key && name) el.setAttribute(key, name);
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
}

function setCanonical(url) {
  let el = document.head.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", url);
}

const clip = (s, n = 155) => {
  const t = String(s ?? "").replace(/\s+/g, " ").trim();
  if (t.length <= n) return t;
  const cut = t.lastIndexOf(" ", n);
  return t.slice(0, cut > 0 ? cut : n).trim() + "…";
};

export function setSeo({ title, description, path }) {
  if (title) document.title = title;
  if (description) {
    setMeta('meta[name="description"]', "content", description);
    setMeta('meta[property="og:description"]', "content", description);
    setMeta('meta[name="twitter:description"]', "content", description);
  }
  if (title) {
    setMeta('meta[property="og:title"]', "content", title);
    setMeta('meta[name="twitter:title"]', "content", title);
  }
  if (path) {
    const url = SITE + path;
    setCanonical(url);
    setMeta('meta[property="og:url"]', "content", url);
  }
}

export const duaSeo = (d) => ({
  title: `${d.titleEn} — Dua in Arabic, transliteration & meaning | Noorly`,
  description: clip(`${d.titleEn}. ${d.translationEn}`),
  path: `/watch/dua/${d.id}`,
});

export const surahSeo = (s) => ({
  title: `Surah ${s.nameEn} (${s.nameArabic}) — word by word with recitation | Noorly`,
  description: clip(`Surah ${s.nameEn} — ${s.nameTranslation}, ${s.numberOfAyahs} ayahs. Listen with word-by-word highlighting. ${s.ayahs?.[0]?.translationEn || ""}`),
  path: `/watch/surah/${s.number}`,
});
