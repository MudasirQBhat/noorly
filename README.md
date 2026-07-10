# Noorly

A calm, ad-free, **YouTube-style** learning app that helps children memorize
**authentic duas** and the **surahs of Juz 30 (Amma Parah)**. A left sidebar lists
every dua (grouped by category) and every surah; clicking one plays it like a
little **video** — an animated scene, the recitation, and word-by-word karaoke
subtitles (Arabic + transliteration + English), all in one player.

- **Frontend:** React + Vite (sidebar + inline video player)
- **Backend:** Node.js + Express (serves content from JSON — no database)
- **Styling:** plain CSS with custom properties (no Tailwind)
- **Visuals:** 100% code-generated SVG/CSS scenes — no photos, no depictions of people or animals
- **Word-sync:** surahs use Quran.com's precomputed timing; dua timing is generated
  locally by **forced alignment** (Whisper) against the recitation audio

## Content (all from open, attributed sources)

| Content | Source |
| --- | --- |
| **199 duas**, 14 categories (text/translation) | Hisnul Muslim ([Hisn-Muslim-Json](https://github.com/wafaaelmaandy/Hisn-Muslim-Json)) |
| **Dua recitation audio** | [hisnmuslim.com](https://www.hisnmuslim.com) |
| **37 surahs** of Juz 30 (An-Naba 78 → An-Nas 114) | Text/translation: [Al Quran Cloud](https://alquran.cloud) (Asad) · Arabic + word timing: [Quran.com API](https://api-docs.quran.com) |
| **Surah recitation audio** | Mishary Alafasy — [quranicaudio.com](https://quranicaudio.com) (word-synced) & [everyayah.com](https://everyayah.com) (per-ayah fallback) |

**No fabricated timestamps.** Surah word timing comes straight from the Quran.com
API. Dua word timing is produced by offline **forced alignment** (`faster-whisper`):
each dua's known Arabic text is aligned to its recitation to recover real per-word
timestamps and the exact audio segment for that dua — so even a dua inside a
multi-dua chapter file plays just itself. 197/199 duas are word-synced; 2 fall back
to whole-dua highlighting.

## Run locally

```bash
# from the Noorly/ root
npm run install:all      # installs root + backend + frontend
npm run dev              # starts API (:4000) and web (:5173) together
```

Then open **http://localhost:5173**.

- Frontend dev server proxies `/api` → `http://localhost:4000`.
- If the API is down, the frontend falls back to the JSON bundled in
  `frontend/src/data/`, so the UI is always testable.

### API

| Route | Returns |
| --- | --- |
| `GET /api/duas` (`?category=`) | all duas / filtered |
| `GET /api/duas/categories` | category names + counts |
| `GET /api/duas/:id` | one dua |
| `GET /api/surahs` | all 37 Juz-30 surahs |
| `GET /api/surahs/:number` | one surah |

## Before going public

See the **Credits** page in the app. In short: (1) send permission notes to the
reciter/EveryAyah and re-check Hisnul Muslim redistribution terms before
publishing or monetizing; (2) record real dua audio + per-word timing; (3) verify
hadith reference numbers against a preferred edition.
