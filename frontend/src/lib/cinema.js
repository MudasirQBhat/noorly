// Adapters that normalize a surah or dua into a single "cinema media" shape.
// The VideoPlayer renders TWO independent karaoke tracks, one short line each:
//   - arabicCues: Arabic grouped into short lines, timed by the real recitation
//   - englishCues: the translation as balanced, evenly-timed caption chunks
import { sceneForDua, sceneForSurah } from "../components/Scenes.jsx";

// Per-scene image paths (one AI landscape per ayah / per dua). If an image is
// not present yet, the player falls back to the animated SVG scene.
const surahImg = (num, ayah) => `/scenes/surah/${num}/${ayah}.jpg`;
const duaImg = (id) => `/scenes/dua/${id}.jpg`;

// Split text into exactly n balanced word-chunks.
function splitEven(text, n) {
  const words = (text || "").trim().split(/\s+/).filter(Boolean);
  if (n <= 1 || words.length === 0) return [(text || "").trim()];
  n = Math.min(n, words.length);
  const out = [];
  const base = Math.floor(words.length / n);
  let extra = words.length % n, idx = 0;
  for (let i = 0; i < n; i++) {
    const take = base + (extra > 0 ? 1 : 0);
    if (extra > 0) extra--;
    out.push(words.slice(idx, idx + take).join(" "));
    idx += take;
  }
  return out;
}

// Force word timings to move strictly forward: clamp each start to the previous
// word's end and give collapsed / zero-length words a minimum duration. Forced
// alignment (used for duas) occasionally stacks a run of words on one timestamp;
// without this the karaoke highlight flickers or jumps backward. Mirrors the
// video renderer's sanitizer so the on-screen and downloaded video stay in sync.
function sanitizeWords(words, startMs, endMs) {
  const num = (v) => typeof v === "number" && !Number.isNaN(v);
  let last = num(startMs) ? startMs : 0;
  for (const w of words) {
    let s = num(w.startMs) ? w.startMs : last;
    if (s < last) s = last;
    let e = num(w.endMs) ? w.endMs : s + 400;
    if (e <= s) e = s + 300;
    w.startMs = s; w.endMs = e; last = e;
  }
  if (num(endMs) && words.length && last < endMs) {
    const lw = words[words.length - 1];
    lw.endMs = Math.max(lw.endMs, Math.min(endMs, last + 800));
  }
  return words;
}

// Group a unit's words into short Arabic lines (≤ maxWords, breaking at pauses).
function arabicLines(words, translitFull, label, maxWords = 5, gapMs = 320) {
  const timed = words.some((w) => w.endMs > 0);
  if (!timed) {
    return [{ label, words, translit: (translitFull || "").trim(), startMs: 0, endMs: 0 }];
  }
  const lines = [];
  let cur = [];
  for (let i = 0; i < words.length; i++) {
    cur.push(words[i]);
    const next = words[i + 1];
    const gap = next ? next.startMs - words[i].endMs : 0;
    const pause = cur.length >= 2 && gap > gapMs;
    if (!next || cur.length >= maxWords || pause) { lines.push(cur); cur = []; }
  }
  const wordsHaveTranslit = words.some((w) => w.translit);
  const trPieces = wordsHaveTranslit ? null : splitEven(translitFull, lines.length);
  return lines.map((ws, idx) => ({
    label,
    words: ws,
    translit: wordsHaveTranslit ? ws.map((w) => w.translit).filter(Boolean).join(" ") : (trPieces[idx] || ""),
    startMs: ws[0].startMs,
    endMs: ws[ws.length - 1].endMs,
  }));
}

// Balanced, evenly-timed English caption chunks across a unit's [start,end].
function englishChunks(translation, startMs, endMs, maxChars = 44) {
  const text = (translation || "").trim();
  if (!text) return [];
  const n = Math.max(1, Math.ceil(text.length / maxChars));
  const pieces = splitEven(text, n);
  if (!(endMs > startMs)) return pieces.map((t) => ({ text: t, startMs: 0, endMs: 0 }));
  const step = (endMs - startMs) / pieces.length;
  return pieces.map((t, i) => ({
    text: t,
    startMs: Math.round(startMs + step * i),
    endMs: Math.round(startMs + step * (i + 1)),
  }));
}

export function surahToCinema(s) {
  const arabicCues = [];
  const englishCues = [];
  const themeCues = [];
  s.ayahs.forEach((a) => {
    const words = a.words.map((w) => ({
      arabic: w.arabic, startMs: w.startMs, endMs: w.endMs,
      gloss: w.translationEn, translit: w.transliteration,
    }));
    arabicLines(words, a.transliteration, `Ayah ${a.numberInSurah}`).forEach((c) => arabicCues.push(c));
    const first = words[0], last = words[words.length - 1];
    englishChunks(a.translationEn, first ? first.startMs : 0, last ? last.endMs : 0).forEach((c) => englishCues.push(c));
    themeCues.push({
      image: surahImg(s.number, a.numberInSurah),
      startMs: first ? first.startMs : 0,
      endMs: last ? last.endMs : 0,
    });
  });
  const imagesUsed = [...new Set(themeCues.map((t) => t.image))];
  return {
    kind: "surah",
    id: `surah-${s.number}`,
    title: s.nameEn,
    subtitle: `${s.nameTranslation} · recited by ${s.reciter}`,
    scene: sceneForSurah(s),
    audioUrl: s.fullAudioUrl,
    audioStartMs: 0,
    audioEndMs: s.fullAudioDurationMs,
    durationMs: s.fullAudioDurationMs,
    hasWordTiming: !!s.hasWordTiming,
    arabicCues,
    englishCues,
    themeCues,
    imagesUsed,
  };
}

export function duaToCinema(d) {
  const aligned = !!d.hasWordTiming && d.words.some((w) => (w.end || 0) > 0);
  const startMs = Math.round((d.audioStart || 0) * 1000);
  const endMs = Math.round((d.audioEnd || 0) * 1000);
  const words = d.words.map((w) => ({
    arabic: w.arabic,
    startMs: Math.round((w.start || 0) * 1000),
    endMs: Math.round((w.end || 0) * 1000),
    translit: w.transliteration || "", gloss: "",
  }));
  // Only sanitize when we actually have alignment; untimed duas keep their
  // whole-text (looping) highlight and must not get synthetic per-word timings.
  if (aligned) sanitizeWords(words, startMs, endMs);
  const arabicCues = arabicLines(words, d.transliteration, "");
  const first = words[0], last = words[words.length - 1];
  const englishCues = englishChunks(
    d.translationEn,
    aligned && first ? first.startMs : 0,
    aligned && last ? last.endMs : 0
  );
  const image = duaImg(d.id);
  const themeCues = [{ image, startMs: 0, endMs: 0 }];
  return {
    kind: "dua",
    id: `dua-${d.id}`,
    title: d.titleEn,
    subtitle: `${d.category} · ${d.reference}`,
    scene: sceneForDua(d.category),
    audioUrl: d.audioUrl || "",
    audioStartMs: startMs,
    audioEndMs: endMs,
    durationMs: endMs,
    hasWordTiming: aligned,
    audioScope: d.audioScope,
    chapterTitle: d.chapterTitle,
    arabicCues,
    englishCues,
    themeCues,
    imagesUsed: [image],
  };
}
