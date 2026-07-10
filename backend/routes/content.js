import { Router } from "express";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, "..", "data");

// Load once at startup (content is static JSON — no DB for now).
const duas = JSON.parse(readFileSync(join(dataDir, "dua.json"), "utf8"));
const surahs = JSON.parse(readFileSync(join(dataDir, "surah.json"), "utf8"));

const router = Router();

// GET /api/duas  — list all duas, or filter by ?category=
router.get("/duas", (req, res) => {
  const { category } = req.query;
  let list = duas;
  if (category) {
    list = duas.filter((d) => d.category.toLowerCase() === String(category).toLowerCase());
  }
  res.json(list);
});

// GET /api/duas/categories  — category names + counts (must precede :id)
router.get("/duas/categories", (_req, res) => {
  const map = new Map();
  duas.forEach((d) => map.set(d.category, (map.get(d.category) || 0) + 1));
  res.json([...map.entries()].map(([name, count]) => ({ name, count })));
});

// GET /api/duas/:id
router.get("/duas/:id", (req, res) => {
  const dua = duas.find((d) => d.id === req.params.id);
  if (!dua) return res.status(404).json({ error: "Dua not found" });
  res.json(dua);
});

// GET /api/surahs  — list all Juz-30 surahs
router.get("/surahs", (_req, res) => res.json(surahs));

// GET /api/surahs/:number
router.get("/surahs/:number", (req, res) => {
  const surah = surahs.find((s) => String(s.number) === String(req.params.number));
  if (!surah) return res.status(404).json({ error: "Surah not found" });
  res.json(surah);
});

export default router;
