// Generate ONE Ghibli-style landscape per scene: every ayah of every Juz-30
// surah, and every dua. Uses the free, keyless Pollinations API. Sequential and
// RESUMABLE — re-run any time to continue (skips images that already exist).
//
//   node scripts/generate-all-scenes.mjs            # generate missing scenes
//   node scripts/generate-all-scenes.mjs --force    # regenerate everything
//
// Each ayah/dua is mapped to a CALM nature theme (never literal depictions of
// punishment etc.), so all imagery stays serene and child-appropriate.
import { writeFileSync, mkdirSync, existsSync, readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "frontend", "public", "scenes");
const surahs = JSON.parse(readFileSync(join(ROOT, "backend", "data", "surah.json"), "utf8"));
const duas = JSON.parse(readFileSync(join(ROOT, "backend", "data", "dua.json"), "utf8"));
const FORCE = process.argv.includes("--force");

const NEG = "no people, no person, no human, no humans, no human silhouette, no crowd, no faces, no figures, deserted, unpopulated, scenery only, nature only";
const STYLE = "Studio Ghibli style, painterly anime landscape, soft natural light, lush, serene, cinematic, wide establishing shot";

const THEME = {
  dawn: "serene sunrise daybreak over rolling green hills, warm golden morning light",
  day: "bright clear blue sky over a green meadow valley, gentle white clouds",
  night: "calm starry night sky with a crescent moon over quiet rolling hills, deep blue",
  stars: "vast night sky full of glowing stars and the milky way over silhouetted plains",
  moon: "a large luminous crescent moon in a deep indigo sky above a calm landscape",
  sun: "radiant bright sun high in a golden sky over shimmering open plains",
  mountains: "majestic layered mountain range under a soft sky, misty peaks",
  sea: "calm turquoise sea meeting the horizon, gentle waves, soft pastel sky",
  garden: "lush green paradise garden with flowing rivers and gentle waterfalls, blooming flowers",
  rivers: "a clear blue river winding through a verdant green valley with small waterfalls",
  rain: "gentle rain falling over green fields, soft grey rainclouds, glistening puddles",
  clouds: "dramatic soft billowing clouds with golden sunbeams breaking through",
  wind: "windswept golden grass fields rippling under moving clouds",
  storm: "distant dramatic storm clouds gathering over a wide empty plain, moody light",
  fire: "distant warm volcanic glow and drifting embers over a dark barren rocky landscape at night",
  earth: "vast open fertile plains and rolling earth stretching to the horizon",
  desert: "golden rippled sand dunes under a warm glowing sky, vast quiet desert",
  orchard: "an orchard of date palms, fig and olive trees heavy with ripe fruit, warm light",
  crops: "green terraced crop fields with sprouting seedlings and fertile farmland",
  sky: "the heavens parting with radiant light beaming through split clouds, ethereal glow",
  spring: "a clear fresh water spring bubbling among green mossy rocks in a quiet glade",
  mosque: "a beautiful empty mosque with domes and minarets against a golden sky, architecture only",
  home: "cozy small houses in a lush green valley at golden dusk, warm glowing windows",
  road: "a winding path through green hills and distant mountains under a soft sky",
  serene: "a peaceful soft pastel landscape with gentle rolling hills and a calm sky",
};

// ---- meaning -> theme (mirror of frontend/src/lib/theme.js) ----
const RULES = [
  [/dawn|daybreak|sunrise|the morning|early hours|forenoon/, "dawn"],
  [/\bnight\b|nightfall|darkness of/, "night"],
  [/\bstars?\b|constellation|milky|the heaven.*adorned/, "stars"],
  [/\bmoon\b/, "moon"],
  [/mountain|firmly set|as pegs|as stakes/, "mountains"],
  [/\bseas?\b|\bocean\b|the deep|tides?/, "sea"],
  [/garden|paradise|orchards of|abode of bliss/, "garden"],
  [/\brivers?\b|streams?\b|flowing water/, "rivers"],
  [/spring|fountain|\bwell\b/, "spring"],
  [/\brain\b|downpour|pour(ed|ing)?|showers|water.*from the sky/, "rain"],
  [/whirlwind|storm|thunder|lightning|tempest/, "storm"],
  [/\bwind\b|breeze|gale/, "wind"],
  [/\bfire\b|hell|blaz|flame|burning|scorch|inferno/, "fire"],
  [/fig|olive|date-palm|dates|\bpalm\b|fruit|grape|vine|orchard/, "orchard"],
  [/grain|crop|seed|harvest|herbage|vegetation|green (pasture|meadow)|sprout|plant/, "crops"],
  [/desert|\bsand\b|dune/, "desert"],
  [/\bsky\b|heaven|firmament|split|cleave|cleft|rent asunder/, "sky"],
  [/cloud/, "clouds"],
  [/\bsun\b|blazing|shining|radian|brightness|glow of/, "sun"],
  [/\bearth\b|the land|ground|soil|expanse|spread out/, "earth"],
  [/mosque|prostrat|bow down|the sacred|kaaba|worship|call to prayer/, "mosque"],
  [/\bday\b|daylight|broad day/, "day"],
];
const DUA_CAT = {
  "Morning & Evening": "dawn", "Sleep & Waking": "night", "Wudu & Cleanliness": "spring",
  "Prayer & Mosque": "mosque", "Home & Family": "home", "Food & Drink": "orchard",
  "Travel": "road", "Weather & Nature": "clouds", "Worry & Relief": "dawn",
  "Sickness & Hardship": "serene", "Manners & People": "day", "Forgiveness & Protection": "sky",
  "Daily Routine": "day", "Remembrance of Allah": "stars",
};
const SURAH_FALLBACK = ["mountains", "sea", "desert", "garden", "night", "dawn"];
function themeForText(text, fb) {
  const t = (text || "").toLowerCase();
  for (const [re, th] of RULES) if (re.test(t)) return th;
  return fb;
}
function themeForDua(cat, text) {
  const t = (text || "").toLowerCase();
  for (const [re, th] of RULES) if (re.test(t)) return th;
  return DUA_CAT[cat] || "serene";
}

const enc = encodeURIComponent;
const hash = (s) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };

// ---------------------------------------------------------------------------
// DUA IMAGES — contextual, people-based scenes. Unlike the surahs (calm nature),
// each dua shows a recurring, modestly-dressed young Muslim boy actually doing
// the dua's action (entering/leaving the bathroom at the door, boarding a car,
// eating, waking, praying...). Wholesome Ghibli storybook style, Shariah-mindful:
// modest clothing, a child only, nothing immodest, and for bathroom duas the
// child stays OUTSIDE the door, fully clothed (never inside/undressed).
const CHILD = "a single cheerful young Muslim boy about 6 years old, wearing a small white prayer cap (kufi) and a simple pastel-colored kurta, modestly and fully dressed, gentle kind face";
const PEOPLE_STYLE = "Studio Ghibli style, soft painterly anime illustration, warm gentle lighting, wholesome children's storybook scene, cozy detailed background, cinematic, heartwarming, wide shot";
const PEOPLE_NEG = "modest clothing only, fully clothed, no bare skin, no adult women, no uncovered women, no crowds, no text, no words, no letters, no logo, no watermark, not scary, no violence, culturally respectful, family friendly";

const pick = (arr, id) => arr[hash(id) % arr.length];

// (A) Specific PHYSICAL-ACTION scenes — the dua is about doing a concrete thing.
// Checked in order, first match wins. These are inherently distinct per action;
// the per-dua seed also varies the composition between duas that share an action.
const ACTION_RULES = [
  [/enter.*(restroom|toilet|bathroom|lavatory)|before.*(restroom|toilet)/, "standing outside a wooden bathroom door in a tidy hallway, fully clothed, about to step inside"],
  [/leav.*(restroom|toilet|bathroom|lavatory)|after.*(restroom|toilet)/, "stepping out of a bathroom doorway into a tidy hallway, fully clothed, drying his hands with a small towel"],
  [/ablution|wudu|wudhu/, "performing wudu, carefully washing his hands and forearms at a clean flowing water tap"],
  [/enter.*mosque/, "walking into a beautiful mosque through its arched doorway, warm light glowing inside"],
  [/leav.*mosque/, "walking out of a mosque doorway into a sunny courtyard"],
  [/athan|adhan|call to prayer/, "listening to the call to prayer with a hand near his ear, a mosque minaret in the distance at golden hour"],
  [/enter.*(home|house)/, "entering a cozy warm home through the front door, welcoming lantern light"],
  [/leav.*(home|house)/, "stepping out of his home's front door into a bright cheerful morning"],
  [/\bdress\b|garment|\bclothes\b|clothing|\bwear\b|wearing|putting on/, "happily putting on fresh clean clothes, looking neat and cheerful in a tidy room"],
  [/mirror/, "looking into a small mirror, tidying his cap, smiling"],
  [/sneez/, "sneezing politely into his elbow, then smiling gratefully"],
  [/before sleep|going to bed|lie down|before sleeping|retiring to bed/, "lying tucked into a cozy bed at night, hands together in a gentle dua, a crescent moon glowing in the window"],
  [/wak(e|ing)|awaken|arises from sleep|from sleep|turns over during the night/, "waking and stretching happily in a sunlit bedroom at dawn"],
  [/nightmare|bad dream|frighten.*sleep/, "sitting up calmly in bed being comforted by soft warm light at night"],
  [/breaking the fast|iftar|break.*fast|ending the fast/, "breaking his fast at sunset with fresh dates and a glass of water on a small table"],
  [/before eat|invocation.*eating|\beat\b|meal|finishes eating|after eating/, "sitting at a table with a simple wholesome meal, hands together saying bismillah"],
  [/drink|water|milk/, "happily drinking a glass of fresh water, looking refreshed and grateful"],
  [/riding|vehicle|conveyance|boarding|\bmount\b|mounting/, "boarding a small car for a journey, waving cheerfully, sunny open road ahead"],
  [/journey|travel|traveler|setting out/, "setting out on a journey with a little backpack, a scenic sunlit road stretching ahead"],
  [/enter.*(town|city)|entering a town|market/, "arriving at the gate of a friendly old town, a gentle sunlit street ahead"],
  [/wind blow|the wind|breeze|storm of wind/, "outdoors as a gentle breeze sways the trees, holding onto his cap, looking up at moving clouds"],
  [/thunder|lightning/, "watching a distant gentle thunderstorm through a window from a cozy, safe room"],
  [/rain|rainfall/, "joyfully watching soft rain fall through a window from a warm cozy room"],
  [/new moon|crescent|sighting the moon/, "gazing up at a glowing crescent moon in a deep starry night sky"],
  [/visiting the sick|visit.*sick/, "kindly visiting a friend resting in bed, offering a caring dua"],
  [/\bsick\b|\bill\b|illness|\bpain\b|fever|terminal|disease|ailment|unwell/, "resting comfortably in bed under a warm blanket, making a gentle hopeful dua"],
  [/black stone|kaaba|safa|marwah|mina|arafat|tawaf|pilgrim|hajj|umrah/, "in a spacious mosque courtyard in gentle daylight, hands raised, at a respectful distance"],
  [/graveyard|cemetery|visiting the grave|deceased|funeral/, "standing quietly in a peaceful green garden at dusk, hands raised in a calm, respectful dua"],
  [/new parents|newborn|baby|congratulat|birth of|for children/, "smiling warmly in a bright cheerful family home, a gentle sense of a new blessing"],
  [/greet|returns a greeting|salaam|salam/, "warmly greeting another young Muslim boy with salam, both smiling politely"],
  [/anger|angry/, "calming down peacefully outdoors, taking a slow breath, a serene expression"],
  [/\bdebt\b|\bloan\b|in debt|burden of debt/, "content and at ease in a tidy warm home, gentle golden light of relief"],
  [/knowledge|seeking knowledge|understand|\blearn\b|\bteach/, "sitting with a small open Quran on a stand, reading by gentle warm light"],
];

// (B) Themed dua scenes — the dua is a supplication; the SCENE reflects what it
// asks Allah for. Setting varies per-dua (env pool) so no two look the same.
const GEN_ENV = [
  "in a lush green garden full of blooming flowers",
  "by a bright window in the soft golden light of sunrise",
  "under a starry night sky with a glowing crescent moon",
  "in a peaceful meadow of gentle rolling hills",
  "beside a clear flowing stream among green trees",
  "on a grassy hilltop overlooking a calm valley",
  "in a cozy warm room with soft lamplight",
  "in a beautiful mosque courtyard with graceful arches",
  "under a large shady tree in a sunlit field",
  "by a calm seashore at soft golden sunset",
  "in a fragrant orchard of date palms and fruit trees",
  "in a quiet green park beside a gentle fountain",
  "on a balcony overlooking a peaceful town at dusk",
  "in a blossoming spring garden with fluttering butterflies",
];
const PRAYER_ENV = [
  "inside a beautiful mosque with tall arched windows and warm light",
  "on a soft patterned prayer rug in a sunlit room",
  "in a grand mosque with a glowing chandelier and calligraphy arches",
  "in a quiet mosque at dawn bathed in soft blue light",
  "in a cozy corner at home on a prayer mat beside a window",
  "in a serene mosque courtyard with a fountain at golden hour",
  "in a peaceful mosque with green carpet and lantern light",
];
const MORNEVE_ENV = [
  "by a window in the warm rose-gold light of early morning",
  "on a rooftop at gentle sunset with a glowing orange sky",
  "in a dew-fresh garden at dawn with birds and soft mist",
  "beside a window at dusk as the first stars appear",
  "in a sunlit courtyard in the calm of early morning",
];
// meaning -> mood/detail that colours the supplication scene
const MOOD = [
  [/protect|refuge|\bevil\b|shaytan|devil|\bharm\b|harmful|\bjinn\b|shelter|\bguard/, "soft protective rays of light gently surrounding him"],
  [/forgive|mercy|repent|pardon|\bsins?\b|sinful|expiat/, "warm forgiving light from above and a peaceful, relieved expression"],
  [/thank|grateful|gratitude|praise|glory|glorif|hamd|bounty/, "arms gently open in joyful gratitude, a radiant warm glow"],
  [/provision|sustenance|rizq|\bbless|wealth|abundance|grant me/, "gentle golden abundance and warm light around him"],
  [/\bguid|straight path|astray|righteous/, "a softly glowing gentle path leading ahead of him"],
  [/\btrust\b|\brely\b|suffic|depend|entrust|tawakkul/, "looking up hopefully at a vast open sky"],
  [/health|\bheal\b|\bcure\b|\bbody\b|strength|well-being|\bsound\b|safety/, "bright, healthy and cheerful, glowing with well-being"],
  [/paradise|jannah|garden of|eternal|hereafter/, "a glimpse of a beautiful paradise garden with flowing rivers far behind"],
  [/patience|hardship|\bease\b|at ease|relief|distress|worry|grief|anxiety|\bsad\b|sorrow|anguish/, "a calm, comforted expression bathed in soothing soft light"],
  [/\blove\b|please you|nearness|\bcontent/, "a serene, contented smile and a gentle radiant warmth"],
];
const moodFor = (t) => { for (const [re, m] of MOOD) if (re.test(t)) return m; return "a serene, hopeful glow"; };

function buildDuaPrompt(d) {
  // The ACTION lives in the title/chapter ("Invocation for entering the mosque");
  // the translation is long and full of incidental words, so use it only to
  // colour the MOOD of open-ended supplications — never to pick the action.
  const tt = ((d.titleEn || "") + " " + (d.chapterTitle || "")).toLowerCase();
  const tr = (d.translationEn || "").toLowerCase();
  const twoKids = /greet|returns a greeting|salaam|\bsalam\b|congratulat|visiting the sick/.test(tt);
  const subject = twoKids
    ? "two cheerful young Muslim boys about 6 years old, wearing small white prayer caps and simple pastel kurtas, modestly and fully dressed"
    : CHILD;

  // 1) concrete physical action (from the title)?
  let scene = null;
  for (const [re, s] of ACTION_RULES) { if (re.test(tt)) { scene = s; break; } }

  // 2) otherwise it's a supplication — reflect its purpose, vary the setting
  if (!scene) {
    const isPrayer = /prostrat|\bruku\b|sujood|\bbow\b|bowing|tashahhud|opening supplication|during .*prayer|in prayer|after .*prayer|before .*salam|\bwitr\b|qunut|rak'?ah|tahajjud|night prayer|two units|between the two prostrations|sitting in prayer|obligatory prayer|sunnah prayer|\bprayer\b|\bsalah\b|\bsalat\b|salaah/.test(tt)
      || d.category === "Prayer & Mosque";
    const isMornEve = d.category === "Morning & Evening" || /morning and evening|in the morning|in the evening/.test(tt);
    if (isPrayer) scene = `praying devoutly on a prayer mat, ${pick(PRAYER_ENV, d.id)}`;
    else if (isMornEve) scene = `making a gentle heartfelt dua with open hands, ${pick(MORNEVE_ENV, d.id)}, ${moodFor(tr)}`;
    else scene = `making a heartfelt dua with open raised hands, ${pick(GEN_ENV, d.id)}, ${moodFor(tr)}`;
  }

  return `${subject}, ${scene}. ${PEOPLE_STYLE}. ${PEOPLE_NEG}`;
}

// Build the full work list
const jobs = [];
surahs.forEach((s) => {
  s.ayahs.forEach((a) => {
    const theme = themeForText(a.translationEn, SURAH_FALLBACK[s.number % 6]);
    jobs.push({ file: join(OUT, "surah", String(s.number), `${a.numberInSurah}.jpg`), theme, seed: s.number * 1000 + a.numberInSurah });
  });
});
// Dua images: contextual, people-based scenes. Include them with GEN_DUAS=1
// (full run) or SAMPLE=id1,id2 (just those dua ids, for previewing the look).
const SAMPLE = (process.env.SAMPLE || "").split(",").map((s) => s.trim()).filter(Boolean);
if (process.env.GEN_DUAS === "1" || SAMPLE.length) {
  duas.forEach((d) => {
    jobs.push({ file: join(OUT, "dua", `${d.id}.jpg`), prompt: buildDuaPrompt(d), seed: hash(d.id), id: d.id });
  });
}

// In SAMPLE mode, generate only the requested dua ids (skip everything else).
const workJobs = SAMPLE.length ? jobs.filter((j) => SAMPLE.includes(j.id)) : jobs;

// PRINT=1 dumps the dua scene prompts (the "what" part) and exits — for review.
if (process.env.PRINT === "1") {
  duas.forEach((d) => console.log(`${d.id} [${d.category}] ${d.titleEn.slice(0, 44).padEnd(44)} => ${buildDuaPrompt(d).split(". Studio")[0].replace(/^[^,]+, /, "")}`));
  process.exit(0);
}

async function run() {
  let done = 0, made = 0, failed = 0;
  const t0 = Date.now();
  for (const job of workJobs) {
    done++;
    if (!FORCE && existsSync(job.file)) continue;
    mkdirSync(dirname(job.file), { recursive: true });
    const prompt = job.prompt || `${THEME[job.theme]}, ${STYLE}, ${NEG}`;
    const url = `https://image.pollinations.ai/prompt/${enc(prompt)}?width=1280&height=720&nologo=true&model=flux&seed=${job.seed}`;
    let ok = false;
    for (let a = 1; a <= 5 && !ok; a++) {
      try {
        const r = await fetch(url);
        if (!r.ok) throw new Error("HTTP " + r.status);
        const b = Buffer.from(await r.arrayBuffer());
        if (b.length < 5000) throw new Error("too small");
        writeFileSync(job.file, b);
        ok = true; made++;
      } catch (e) { await new Promise((r) => setTimeout(r, 2500 * a)); }
    }
    if (!ok) { failed++; console.log("FAIL", job.file); }
    if (made % 5 === 0 && ok) {
      const rate = (Date.now() - t0) / made / 1000;
      const left = workJobs.length - done;
      console.log(`made=${made} done=${done}/${workJobs.length} fail=${failed} ~${rate.toFixed(0)}s/img ETA ${(left * rate / 60).toFixed(0)}min`);
    }
    await new Promise((r) => setTimeout(r, 600));
  }
  console.log(`COMPLETE: made=${made} failed=${failed} of ${workJobs.length} scenes`);
  if (SAMPLE.length) console.log("=== SAMPLE COMPLETE ===");
  else if (process.env.GEN_DUAS !== "1") console.log("=== SURAHS COMPLETE — dua generation paused (awaiting people-based prompts) ===");
}
run();
