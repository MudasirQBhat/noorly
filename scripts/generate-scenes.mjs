// Generate the meaning-driven scene backgrounds (Ghibli-style landscapes) using
// the free, keyless Pollinations image API, saved to frontend/public/scenes/.
//
// Usage (from the repo root):
//   node scripts/generate-scenes.mjs                 # generate any missing images
//   node scripts/generate-scenes.mjs --force         # regenerate ALL (new seeds)
//   node scripts/generate-scenes.mjs --only mosque,sea   # regenerate specific themes
//
// Prompts deliberately exclude people and faces. AI can still occasionally add a
// figure — eyeball the results and re-roll any theme with --only <theme> --force.
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "frontend", "public", "scenes");
mkdirSync(OUT, { recursive: true });

const args = process.argv.slice(2);
const FORCE = args.includes("--force");
const onlyIdx = args.indexOf("--only");
const ONLY = onlyIdx >= 0 ? (args[onlyIdx + 1] || "").split(",").filter(Boolean) : null;

const NEG = "absolutely no people, no person, no human, no humans, no human silhouette, no crowd, no faces, no figures, deserted, unpopulated, uninhabited, completely empty of people, scenery only, nature only";
const STYLE = "Studio Ghibli style, painterly anime landscape, soft natural light, lush, serene, cinematic, highly detailed, wide establishing shot, pristine nature";

// theme -> scene description. Keep keys in sync with frontend/src/lib/theme.js
const THEMES = {
  dawn: "serene sunrise daybreak over rolling green hills, warm golden morning light, soft glowing clouds",
  day: "bright clear blue sky over a green meadow valley, gentle white clouds, sunny peaceful",
  night: "calm starry night sky with a crescent moon over quiet rolling hills, deep blue, tranquil",
  stars: "vast night sky full of glowing stars and the milky way over silhouetted plains, cosmic wonder",
  moon: "a large luminous crescent moon in a deep indigo sky above a calm still landscape",
  sun: "radiant bright sun high in a golden sky over shimmering open plains, glowing light",
  mountains: "majestic layered mountain range under a soft sky, misty snow-capped peaks, grand vista",
  sea: "calm turquoise sea meeting the horizon, gentle rolling waves, soft pastel sky, tranquil ocean",
  garden: "lush green paradise garden with flowing rivers and gentle waterfalls, blooming flowers, verdant",
  rivers: "a clear blue river winding through a verdant green valley with small waterfalls, fertile",
  rain: "gentle rain falling over green fields, soft grey rainclouds, glistening puddles, fresh",
  clouds: "dramatic soft billowing clouds in a wide sky with golden sunbeams breaking through, heavenly",
  wind: "windswept golden grass fields rippling under moving clouds, breezy open plain",
  storm: "distant dramatic storm clouds gathering over a wide empty plain, moody atmospheric light",
  fire: "distant volcanic glow and drifting embers over a dark barren rocky landscape at night, ominous, no people",
  earth: "vast open fertile plains and rolling earth stretching to the horizon under soft light",
  desert: "golden rippled sand dunes under a warm glowing sky, vast quiet desert",
  orchard: "an orchard of date palms, fig and olive trees heavy with ripe fruit, warm afternoon light",
  crops: "green terraced crop fields with sprouting seedlings and fertile farmland, gentle sunlight",
  sky: "the heavens parting with radiant light beaming through split clouds, ethereal celestial glow",
  spring: "a clear fresh water spring bubbling among green mossy rocks in a quiet glade",
  mosque: "a beautiful empty mosque with domes and tall minarets against a golden sunset sky, empty clear sky, architecture only, no people",
  home: "cozy small houses in a lush green valley at golden dusk with warm glowing windows, no people",
  road: "a winding dirt path through green hills and distant mountains under a soft sky, a peaceful journey, no people",
  serene: "a peaceful soft pastel landscape with gentle rolling hills and a calm gradient sky, calm and hopeful",
};

// Number of variant images per theme (for visual variety across ayahs/duas).
const VARIANTS = Number(process.env.VARIANTS || 3);
const enc = (s) => encodeURIComponent(s);
let seed = 4200;

async function gen(name, v, desc) {
  const file = join(OUT, `${name}-${v}.jpg`);
  if (!FORCE && existsSync(file)) { console.log(`skip ${name}-${v}`); return; }
  const url = `https://image.pollinations.ai/prompt/${enc(`${desc}, ${STYLE}, ${NEG}`)}?width=1280&height=720&nologo=true&model=flux&seed=${seed++}`;
  for (let a = 1; a <= 3; a++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("HTTP " + res.status);
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 5000) throw new Error("too small");
      writeFileSync(file, buf);
      console.log(`ok ${name}-${v}: ${buf.length} bytes`);
      return;
    } catch (e) {
      console.log(`retry ${name}-${v} (${a}): ${e.message}`);
      await new Promise((r) => setTimeout(r, 2000 * a));
    }
  }
  console.log(`FAILED ${name}-${v}`);
}

const entries = Object.entries(THEMES).filter(([k]) => !ONLY || ONLY.includes(k));
for (const [name, desc] of entries)
  for (let v = 1; v <= VARIANTS; v++) await gen(name, v, desc);
console.log(`done (${entries.length} themes x ${VARIANTS} variants) →`, OUT);
