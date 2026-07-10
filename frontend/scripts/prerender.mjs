// Post-build SEO pass.
//
// The app is a client-rendered SPA, so a crawler that doesn't execute JS sees an
// empty <div id="root">. This script walks every route and writes a real static
// HTML file containing:
//   - a unique <title> and meta description
//   - canonical + Open Graph + Twitter tags
//   - JSON-LD structured data
//   - the actual dua/surah text, so the page is indexable without JS
//
// React's createRoot() clears #root on mount, so users still get the full app —
// the prerendered markup is simply what paints first (and what crawlers read).
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const DIST = join(ROOT, "dist");

const SITE = process.env.SITE_URL || "https://noorlyapp.vercel.app";

const duas = JSON.parse(readFileSync(join(ROOT, "src/data/dua.json"), "utf8"));
const surahs = JSON.parse(readFileSync(join(ROOT, "src/data/surah.json"), "utf8"));
const { FAQ } = await import("../src/lib/faq.js");
const template = readFileSync(join(DIST, "index.html"), "utf8");

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

// meta descriptions must be distinct and readable; trim on a word boundary
const clip = (s, n = 155) => {
  const t = String(s ?? "").replace(/\s+/g, " ").trim();
  if (t.length <= n) return t;
  return t.slice(0, t.lastIndexOf(" ", n) > 0 ? t.lastIndexOf(" ", n) : n).trim() + "…";
};

function head({ title, description, path, jsonld }) {
  const url = SITE + path;
  const img = `${SITE}/og-image.png`;
  return `
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(description)}" />
    <link rel="canonical" href="${esc(url)}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Noorly" />
    <meta property="og:title" content="${esc(title)}" />
    <meta property="og:description" content="${esc(description)}" />
    <meta property="og:url" content="${esc(url)}" />
    <meta property="og:image" content="${esc(img)}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${esc(title)}" />
    <meta name="twitter:description" content="${esc(description)}" />
    <meta name="twitter:image" content="${esc(img)}" />
    ${(Array.isArray(jsonld) ? jsonld : [jsonld]).map((j) => `<script type="application/ld+json">${JSON.stringify(j)}</script>`).join("\n    ")}`;
}

function crumbs(path, name) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Noorly", item: SITE },
      { "@type": "ListItem", position: 2, name, item: SITE + path },
    ],
  };
}

// Write dist/<path>/index.html with the head replaced and body content injected.
function emit(path, headHtml, bodyHtml) {
  let html = template
    // strip the template's single title + description so we can substitute unique ones
    .replace(/<title>[\s\S]*?<\/title>/, "")
    .replace(/<meta\s+name="description"[\s\S]*?\/>/, "")
    .replace("</head>", `${headHtml}\n  </head>`)
    .replace('<div id="root"></div>', `<div id="root">${bodyHtml}</div>`);

  const out = path === "/" ? join(DIST, "index.html") : join(DIST, path, "index.html");
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, html);
}

// ---------- home ----------
const faqText = FAQ.map((f) => `<section><h3>${esc(f.q)}</h3><p>${esc(f.a)}</p></section>`).join("");
emit("/",
  head({
    title: "Noorly — Learn & Memorize Duas and Juz 30 for Kids, Word by Word",
    description: "A calm, free and ad-free way for children to memorize 199 authentic duas and Surah Al-Fatiha plus the 37 surahs of Juz 30 — with real recitation, transliteration and word-by-word highlighting.",
    path: "/",
    jsonld: [
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "Noorly",
        url: SITE,
        description: "Learn and memorize authentic duas and the surahs of Juz 30 with word-by-word recitation.",
      },
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: FAQ.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  }),
  `<main><h1>Noorly — learn and memorize duas and Juz 30, word by word</h1>
   <p>Noorly turns authentic duas, Surah Al-Fatiha and all the surahs of Juz 30 into gentle little videos — a calm scene, the real recitation, and the words glowing along with subtitles.</p>
   <p>199 duas from Hisnul Muslim across 14 everyday moments, and 38 surahs recited by Mishary Rashid Alafasy.</p>
   <h2>Frequently asked questions</h2>${faqText}</main>`
);

// ---------- about ----------
emit("/about",
  head({
    title: "Credits & Sources | Noorly",
    description: "Every text and audio source used in Noorly: Hisnul Muslim, the Quran.com and Al Quran Cloud APIs, reciters Mishary Rashid Alafasy and Shaykh Yahya Hawwa.",
    path: "/about",
    jsonld: crumbs("/about", "Credits & Sources"),
  }),
  `<main><h1>Credits &amp; Sources</h1><p>Noorly is a non-commercial learning app for children. Qur'an recitation by Mishary Rashid Alafasy; dua recitation by Shaykh Yahya Hawwa.</p></main>`
);

// ---------- duas ----------
let n = 0;
for (const d of duas) {
  const title = `${d.titleEn} — dua in Arabic, transliteration & meaning | Noorly`;
  const description = clip(`${d.titleEn} — Arabic with transliteration and English meaning, and word-by-word recitation to help kids memorize it. ${d.translationEn}`);
  const path = `/watch/dua/${d.id}`;
  emit(path,
    head({
      title, description, path,
      jsonld: crumbs(path, d.titleEn),
    }),
    `<main>
      <h1>${esc(d.titleEn)}</h1>
      <p>${esc(d.category)} · ${esc(d.reference)} · recited by ${esc(d.audioReciter || "")}</p>
      <p lang="ar" dir="rtl">${esc(d.arabic)}</p>
      <p><em>${esc(d.transliteration)}</em></p>
      <p>${esc(d.translationEn)}</p>
    </main>`
  );
  n++;
}

// ---------- surahs ----------
for (const s of surahs) {
  const title = `Surah ${s.nameEn} (${s.nameArabic}) — word by word, transliteration & meaning | Noorly`;
  const first = s.ayahs?.[0]?.translationEn || "";
  const description = clip(`Surah ${s.nameEn} (${s.nameTranslation}), all ${s.numberOfAyahs} ayahs — read and listen word by word with transliteration and English translation. ${first}`);
  const path = `/watch/surah/${s.number}`;
  const ayahs = (s.ayahs || []).map((a) =>
    `<section><p lang="ar" dir="rtl">${esc(a.arabic)}</p><p><em>${esc(a.transliteration)}</em></p><p>${esc(a.translationEn)}</p></section>`
  ).join("");
  emit(path,
    head({ title, description, path, jsonld: crumbs(path, `Surah ${s.nameEn}`) }),
    `<main>
      <h1>Surah ${esc(s.nameEn)} — ${esc(s.nameArabic)}</h1>
      <p>${esc(s.nameTranslation)} · ${s.numberOfAyahs} ayahs · ${esc(s.revelationType)} · recited by ${esc(s.reciter)}</p>
      ${ayahs}
    </main>`
  );
  n++;
}

// ---------- sitemap + robots ----------
const urls = [
  { loc: "/", pri: "1.0" },
  { loc: "/about", pri: "0.5" },
  ...surahs.map((s) => ({ loc: `/watch/surah/${s.number}`, pri: "0.8" })),
  ...duas.map((d) => ({ loc: `/watch/dua/${d.id}`, pri: "0.8" })),
];
const today = new Date().toISOString().slice(0, 10);
writeFileSync(join(DIST, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  urls.map((u) => `  <url><loc>${SITE}${u.loc}</loc><lastmod>${today}</lastmod><priority>${u.pri}</priority></url>`).join("\n") +
  `\n</urlset>\n`);

writeFileSync(join(DIST, "robots.txt"),
  `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);

console.log(`prerendered ${n + 2} pages · sitemap: ${urls.length} urls · robots.txt`);
