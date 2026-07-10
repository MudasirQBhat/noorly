// Server-side video renderer: composes per-ayah scene images + recitation audio
// + burned-in subtitles (Arabic karaoke, transliteration, English) into an mp4.
import { spawn } from "child_process";
import { writeFileSync, readFileSync, mkdtempSync, existsSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const FONTS = join(ROOT, "fonts");
const SCENES = join(ROOT, "..", "frontend", "public", "scenes");

const W = 1280, H = 720;

// ---- cue building (mirrors frontend/src/lib/cinema.js) ----
function splitEven(text, n) {
  const words = (text || "").trim().split(/\s+/).filter(Boolean);
  if (n <= 1 || !words.length) return [(text || "").trim()];
  n = Math.min(n, words.length);
  const out = []; const base = Math.floor(words.length / n); let extra = words.length % n, i = 0;
  for (let k = 0; k < n; k++) { const t = base + (extra > 0 ? 1 : 0); if (extra > 0) extra--; out.push(words.slice(i, i + t).join(" ")); i += t; }
  return out;
}
function chunkText(text, max = 44) {
  const words = (text || "").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [""];
  const out = []; let cur = "";
  for (const w of words) { if (cur && cur.length + 1 + w.length > max) { out.push(cur); cur = w; } else cur = cur ? cur + " " + w : w; }
  if (cur) out.push(cur);
  return out;
}
function arabicLines(words, translitFull, maxWords = 5, gapMs = 320) {
  const timed = words.some((w) => w.endMs > 0);
  if (!timed) return [{ words, translit: translitFull, startMs: 0, endMs: 0 }];
  const lines = []; let cur = [];
  for (let i = 0; i < words.length; i++) {
    cur.push(words[i]); const next = words[i + 1];
    const gap = next ? next.startMs - words[i].endMs : 0;
    if (!next || cur.length >= maxWords || (cur.length >= 2 && gap > gapMs)) { lines.push(cur); cur = []; }
  }
  const hasT = words.some((w) => w.translit);
  const tr = hasT ? null : splitEven(translitFull, lines.length);
  return lines.map((ws, idx) => ({
    words: ws,
    translit: hasT ? ws.map((w) => w.translit).filter(Boolean).join(" ") : (tr[idx] || ""),
    startMs: ws[0].startMs, endMs: ws[ws.length - 1].endMs,
  }));
}
function englishChunks(translation, s, e, max = 44) {
  const text = (translation || "").trim(); if (!text) return [];
  const n = Math.max(1, Math.ceil(text.length / max));
  const pieces = splitEven(text, n); const step = (e - s) / pieces.length;
  return pieces.map((t, i) => ({ text: t, startMs: Math.round(s + step * i), endMs: Math.round(s + step * (i + 1)) }));
}

const num = (x) => typeof x === "number" && !isNaN(x);
// fill undefined/NaN/out-of-order word timings monotonically so nothing is NaN
function sanitize(words, start, end) {
  let last = num(start) ? start : 0;
  for (const w of words) {
    let s = num(w.startMs) ? w.startMs : last;
    if (s < last) s = last;
    let e = num(w.endMs) ? w.endMs : s + 400;
    if (e <= s) e = s + 300;
    w.startMs = s; w.endMs = e; last = e;
  }
  if (num(end) && last < end && words.length) words[words.length - 1].endMs = Math.max(words[words.length - 1].endMs, Math.min(end, last + 800));
  return words;
}

// Build a normalized timeline for either a surah or a dua.
function buildTimeline(item, kind) {
  const arCues = [], enCues = [], scenes = [];
  if (kind === "surah") {
    const total = item.fullAudioDurationMs || 0;
    const ayahWords = item.ayahs.map((a) => a.words.map((w) => ({ arabic: w.arabic, startMs: w.startMs, endMs: w.endMs, translit: w.transliteration })));
    sanitize(ayahWords.flat(), 0, total); // mutates the shared word objects
    item.ayahs.forEach((a, ai) => {
      const words = ayahWords[ai];
      arabicLines(words, a.transliteration).forEach((c) => arCues.push(c));
      const first = words[0], last = words[words.length - 1];
      englishChunks(a.translationEn, first ? first.startMs : 0, last ? last.endMs : 0).forEach((c) => enCues.push(c));
      scenes.push({ startMs: first ? first.startMs : 0, endMs: last ? last.endMs : 0, img: join(SCENES, "surah", String(item.number), `${a.numberInSurah}.jpg`) });
    });
    return { arCues, enCues, scenes, offsetMs: 0, startMs: 0, endMs: total || (scenes.length ? scenes[scenes.length - 1].endMs : 0), audioUrl: item.fullAudioUrl };
  }
  // dua
  const s = Math.round((item.audioStart || 0) * 1000), e = Math.round((item.audioEnd || 0) * 1000);
  const words = item.words.map((w) => ({ arabic: w.arabic, startMs: Math.round((w.start || 0) * 1000), endMs: Math.round((w.end || 0) * 1000), translit: "" }));
  sanitize(words, s, e);
  arabicLines(words, item.transliteration).forEach((c) => arCues.push(c));
  const first = words[0], last = words[words.length - 1];
  englishChunks(item.translationEn, first ? first.startMs : s, last ? last.endMs : e).forEach((c) => enCues.push(c));
  scenes.push({ startMs: s, endMs: e, img: join(SCENES, "dua", `${item.id}.jpg`) });
  return { arCues, enCues, scenes, offsetMs: s, startMs: s, endMs: e, audioUrl: item.audioUrl };
}

// ---- ASS subtitle file ----
const ms2ass = (ms) => {
  ms = Math.max(0, ms); const cs = Math.round(ms / 10);
  const h = Math.floor(cs / 360000), m = Math.floor((cs % 360000) / 6000), s = Math.floor((cs % 6000) / 100), c = cs % 100;
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(c).padStart(2, "0")}`;
};
const assEscape = (t) => (t || "").replace(/[{}]/g, "").replace(/\n/g, " ");

function buildAss(tl) {
  const off = tl.offsetMs;
  const head = `[Script Info]
ScriptType: v4.00+
PlayResX: ${W}
PlayResY: ${H}
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Arabic,Amiri,64,&H007D60E8,&H00FFFFFF,&H00201810,&H64000000,-1,0,0,0,100,100,0,0,1,3.5,2,8,60,60,180,1
Style: Translit,Amiri,32,&H0031A5E0,&H0031A5E0,&H00201810,&H64000000,0,1,0,0,100,100,0,0,1,2.5,1,8,60,60,330,1
Style: English,Amiri,38,&H00FFFFFF,&H00FFFFFF,&H00201810,&HA0000000,-1,0,0,0,100,100,0,0,3,0,0,2,80,80,70,1

[Events]
Format: Layer, Start, End, Style, MarginL, MarginR, MarginV, Effect, Text\n`;
  const lines = [];
  // Arabic karaoke (words fill with rose as they are recited)
  tl.arCues.forEach((c) => {
    const timed = c.words.some((w) => w.endMs > 0);
    let text;
    if (timed) {
      text = c.words.map((w, i) => {
        const dur = Math.max(8, Math.round(((w.endMs - w.startMs) || 300) / 10)); // centiseconds
        return `{\\kf${dur}}${assEscape(w.arabic)} `;
      }).join("").trim();
    } else {
      text = c.words.map((w) => assEscape(w.arabic)).join(" ");
    }
    lines.push(`Dialogue: 0,${ms2ass(c.startMs - off)},${ms2ass(c.endMs - off)},Arabic,,0,0,0,,${text}`);
    if (c.translit) lines.push(`Dialogue: 0,${ms2ass(c.startMs - off)},${ms2ass(c.endMs - off)},Translit,,0,0,0,,\u200E${assEscape(c.translit)}`);
  });
  tl.enCues.forEach((c) => {
    lines.push(`Dialogue: 0,${ms2ass(c.startMs - off)},${ms2ass(c.endMs - off)},English,,0,0,0,,\u200E${assEscape(c.text)}`);
  });
  return head + lines.join("\n") + "\n";
}

// ---- concat slideshow list ----
function buildSlideshow(tl, dir, fallback) {
  const lines = [];
  const off = tl.offsetMs;
  const totalSec = (tl.endMs - off) / 1000;
  const scenes = tl.scenes;
  scenes.forEach((sc, i) => {
    let start = (sc.startMs - off) / 1000; if (!num(start) || start < 0) start = 0;
    let nextStart = i + 1 < scenes.length ? (scenes[i + 1].startMs - off) / 1000 : totalSec;
    if (!num(nextStart) || nextStart <= start) nextStart = start + 1;
    const dur = Math.max(0.4, nextStart - start);
    const img = existsSync(sc.img) ? sc.img : fallback;
    lines.push(`file '${img.replace(/'/g, "'\\''")}'`);
    lines.push(`duration ${dur.toFixed(3)}`);
  });
  const lastImg = existsSync(scenes[scenes.length - 1].img) ? scenes[scenes.length - 1].img : fallback;
  lines.push(`file '${lastImg.replace(/'/g, "'\\''")}'`);
  const p = join(dir, "slides.txt");
  writeFileSync(p, lines.join("\n") + "\n");
  return p;
}

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args);
    let err = "";
    p.stderr.on("data", (d) => (err += d.toString()));
    p.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exit ${code}: ${err.slice(-500)}`))));
    p.on("error", reject);
  });
}

// Render an item (surah/dua) to an mp4 at outPath.
export async function renderVideo(item, kind, outPath) {
  const dir = mkdtempSync(join(tmpdir(), "noorly-render-"));
  try {
    const tl = buildTimeline(item, kind);
    // 1. download audio (with retries — upstream CDNs occasionally hiccup)
    const audioPath = join(dir, "audio.mp3");
    let buf = null;
    for (let a = 1; a <= 4 && !buf; a++) {
      try {
        const r = await fetch(tl.audioUrl);
        if (!r.ok) throw new Error("HTTP " + r.status);
        buf = Buffer.from(await r.arrayBuffer());
      } catch (e) { if (a === 4) throw new Error("audio download failed: " + e.message); await new Promise((x) => setTimeout(x, 1500 * a)); }
    }
    writeFileSync(audioPath, buf);
    // 2. fallback background
    const fallback = join(dir, "bg.jpg");
    await run("ffmpeg", ["-y", "-f", "lavfi", "-i", `color=c=0x0f5a56:s=${W}x${H}`, "-frames:v", "1", fallback]);
    // 3. slideshow + subs
    const slides = buildSlideshow(tl, dir, fallback);
    const assPath = join(dir, "subs.ass");
    writeFileSync(assPath, buildAss(tl));
    // 4. ffmpeg compose
    const segStart = tl.startMs / 1000;
    const segDur = (tl.endMs - tl.startMs) / 1000;
    const vf = `scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},subtitles=${assPath.replace(/[\\:']/g, (m) => "\\" + m)}:fontsdir=${FONTS}`;
    const args = [
      "-y",
      "-f", "concat", "-safe", "0", "-i", slides,
      "-ss", String(segStart), "-t", String(segDur), "-i", audioPath,
      "-vf", vf,
      "-map", "0:v", "-map", "1:a",
      "-c:v", "libx264", "-preset", "veryfast", "-pix_fmt", "yuv420p", "-r", "25",
      "-c:a", "aac", "-b:a", "160k",
      "-t", String(segDur), "-movflags", "+faststart",
      outPath,
    ];
    if (process.env.RDEBUG) {
      console.error("=== slides.txt ===\n" + readFileSync(slides, "utf8"));
      console.error("=== ffmpeg args ===\n" + args.join(" "));
    }
    await run("ffmpeg", args);
    return outPath;
  } finally {
    try { rmSync(dir, { recursive: true, force: true }); } catch {}
  }
}
