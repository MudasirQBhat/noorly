import { Router } from "express";
import { readFileSync, createReadStream, unlinkSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { tmpdir } from "os";
import { timingSafeEqual } from "crypto";
import { renderVideo } from "../lib/render.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, "..", "data");
const duas = JSON.parse(readFileSync(join(dataDir, "dua.json"), "utf8"));
const surahs = JSON.parse(readFileSync(join(dataDir, "surah.json"), "utf8"));

const router = Router();

// Admin password — override with the ADMIN_PASSWORD env var in production.
const DEFAULT_PASSWORD = "noorly-admin";
const PASSWORD = process.env.ADMIN_PASSWORD || DEFAULT_PASSWORD;
// Session token handed out on login; required for downloads.
const TOKEN = process.env.ADMIN_TOKEN || "noorly-" + Buffer.from(PASSWORD).toString("base64url").slice(0, 16);

// The token is derived from the password, so shipping the default password to a
// public server would let anyone derive it and hit the CPU-heavy /render route.
// Fail closed: in production the admin API stays off unless a real password is set.
const ADMIN_DISABLED = process.env.NODE_ENV === "production" && PASSWORD === DEFAULT_PASSWORD;
if (ADMIN_DISABLED) console.warn("[admin] ADMIN_PASSWORD unset in production — admin API disabled.");

router.use((_req, res, next) => {
  if (ADMIN_DISABLED) return res.status(503).json({ error: "Admin API disabled: ADMIN_PASSWORD is not configured." });
  next();
});

// Constant-time compare so the shared token can't be probed byte-by-byte.
function tokenOk(given) {
  const a = Buffer.from(String(given ?? ""));
  const b = Buffer.from(TOKEN);
  return a.length === b.length && timingSafeEqual(a, b);
}

// Only these hosts may be proxied for download (no open proxy).
const ALLOWED = [
  /(^|\.)quranicaudio\.com$/i,
  /(^|\.)everyayah\.com$/i,
  /(^|\.)hisnmuslim\.com$/i,
  /(^|\.)quran\.com$/i,
];

router.post("/login", (req, res) => {
  const { password } = req.body || {};
  if (password && password === PASSWORD) return res.json({ ok: true, token: TOKEN });
  return res.status(401).json({ ok: false, error: "Incorrect password" });
});

// Stream a whitelisted remote file back with an attachment header so the
// browser downloads it (handles cross-origin + forces a filename).
router.get("/download", async (req, res) => {
  const { url, token, name } = req.query;
  if (!tokenOk(token)) return res.status(403).json({ error: "Forbidden" });
  let u;
  try { u = new URL(url); } catch { return res.status(400).json({ error: "Bad url" }); }
  if (!ALLOWED.some((re) => re.test(u.hostname))) return res.status(400).json({ error: "Domain not allowed" });
  try {
    const upstream = await fetch(u.href);
    if (!upstream.ok) return res.status(502).json({ error: "Upstream " + upstream.status });
    const safe = String(name || "noorly").replace(/[^a-z0-9._-]/gi, "_");
    res.setHeader("Content-Type", upstream.headers.get("content-type") || "application/octet-stream");
    res.setHeader("Content-Disposition", `attachment; filename="${safe}"`);
    const buf = Buffer.from(await upstream.arrayBuffer());
    res.setHeader("Content-Length", buf.length);
    res.send(buf);
  } catch (e) {
    console.error("[admin/download] error:", e?.message, e?.cause?.message || "");
    res.status(502).json({ error: "Download failed" });
  }
});

// Render a surah/dua into an mp4 (scene + recitation + burned subtitles) and stream it.
let rendering = 0;
router.get("/render", async (req, res) => {
  const { type, id, token } = req.query;
  if (!tokenOk(token)) return res.status(403).json({ error: "Forbidden" });
  if (rendering >= 2) return res.status(429).json({ error: "Busy — another video is rendering, try again shortly" });
  let item, kind, name;
  if (type === "surah") { item = surahs.find((s) => String(s.number) === String(id)); kind = "surah"; name = item?.nameEn; }
  else { item = duas.find((d) => d.id === id); kind = "dua"; name = item?.titleEn; }
  if (!item) return res.status(404).json({ error: "Not found" });

  const out = join(tmpdir(), `noorly-${type}-${String(id).replace(/[^a-z0-9]/gi, "")}-${process.pid}-${rendering}.mp4`);
  rendering++;
  try {
    await renderVideo(item, kind, out);
    const safe = String(name || "noorly").replace(/[^a-z0-9._-]/gi, "_");
    res.setHeader("Content-Type", "video/mp4");
    res.setHeader("Content-Disposition", `attachment; filename="${safe}.mp4"`);
    const stream = createReadStream(out);
    stream.pipe(res);
    const cleanup = () => { try { unlinkSync(out); } catch {} };
    stream.on("close", cleanup);
    res.on("close", cleanup);
  } catch (e) {
    console.error("[admin/render]", e.message);
    try { unlinkSync(out); } catch {}
    if (!res.headersSent) res.status(500).json({ error: "Render failed" });
  } finally {
    rendering--;
  }
});

export default router;
