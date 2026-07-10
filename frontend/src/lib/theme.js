// Map the MEANING of a line to a scene theme, so the picture follows the words
// documentary-style. Keyword rules on the English translation for surahs;
// category mapping for duas. Themes must match generated images in /public/scenes.

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
  [/\bfire\b|hell|blaz|flame|burning|scorch|the blaze|inferno/, "fire"],
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

export function themeForText(text, fallback = "serene") {
  const t = (text || "").toLowerCase();
  for (const [re, theme] of RULES) if (re.test(t)) return theme;
  return fallback;
}

const DUA_CATEGORY_THEME = {
  "Morning & Evening": "dawn",
  "Sleep & Waking": "night",
  "Wudu & Cleanliness": "spring",
  "Prayer & Mosque": "mosque",
  "Home & Family": "home",
  "Food & Drink": "orchard",
  "Travel": "road",
  "Weather & Nature": "clouds",
  "Worry & Relief": "dawn",
  "Sickness & Hardship": "serene",
  "Manners & People": "day",
  "Forgiveness & Protection": "sky",
  "Daily Routine": "day",
  "Remembrance of Allah": "stars",
};

export function themeForDua(category, text) {
  // prefer a strong keyword hit in the dua's meaning, else its category
  const kw = themeForText(text, "");
  return kw || DUA_CATEGORY_THEME[category] || "serene";
}

// Number of image variants generated per theme (see scripts/generate-scenes.mjs).
export const VARIANTS = 3;

function hashKey(key) {
  if (typeof key === "number") return Math.abs(Math.floor(key));
  let h = 0; const s = String(key);
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

// Resolve a theme + a stable key (ayah number or dua id) to a specific image
// variant, so different ayahs/duas of the same theme show different pictures.
export function imageForTheme(theme, key) {
  const v = (hashKey(key) % VARIANTS) + 1;
  return `/scenes/${theme}-${v}.jpg`;
}

// The full set of themes we generate images for (for preloading / validation).
export const ALL_THEMES = [
  "dawn", "day", "night", "stars", "moon", "sun", "mountains", "sea", "garden",
  "rivers", "rain", "clouds", "wind", "storm", "fire", "earth", "desert",
  "orchard", "crops", "sky", "spring", "mosque", "home", "road", "serene",
];
