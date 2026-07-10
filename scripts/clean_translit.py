#!/usr/bin/env python3
"""Clean English narration/notes out of dua transliteration fields.

Most Hisnul-Muslim transliterations wrap the romanized dua in English prose
(hadith narrator intros, usage notes). This extracts just the romanized-Arabic
clauses. Run with --apply to write both data copies; without it, previews only.
Only the `transliteration` field is touched — never arabic/audio/timing/words.
"""
import json, re, sys, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BE = os.path.join(ROOT, "backend", "data", "dua.json")
FE = os.path.join(ROOT, "frontend", "src", "data", "dua.json")

# clearly-English words (ambiguous 2-letter particles left out so Arabic
# particles like "an", "in", "min" are never mistaken for English)
STOP = set((
    "the she said says reported whoever should note prophet messenger those around "
    "favour reward paradise evening morning verse following immediately declaration "
    "place site pain best return battle pleased used between corner black stone circled "
    "camel reached came narrated sheep ordered distribution servant replied treasure "
    "treasures inform shall would when then related instead reads times raise raised "
    "commend counted excelled praising foretell occurrence casual event thinks initially "
    "hundred sins wiped foam sea tongue scale beloved unable gain thousand deeds somebody "
    "sitting marry woman buy maidservant feeds milk drink sneezes brother companion "
    "remember forget starting about distributing right worshipped verily among wrong "
    "doers perfect recite also encourage instruct shahadah supplication supplications "
    "people person being congratulated reply during illness passed away dip hands his "
    "him her who what did they say ask staff point yemeni pilgrimage high every was were "
    "given gives whomever declaration mu his voice elongate add third time one first "
    "second following declaration").split())

def is_roman(clause):
    words = re.findall(r"[A-Za-z'\-]+", clause)
    if len(words) < 1:
        return False
    return sum(1 for w in words if w.lower().strip("'-") in STOP) == 0

def extract(tr):
    tr = tr.strip().strip("'").strip('"')
    parts = re.split(r"(?:\. |: ?|\.(?=[A-Za-z])|\n)", tr)
    keep = [p.strip(" .") for p in parts if p.strip(" .") and is_roman(p)]
    out = ". ".join(keep)
    return (out + ".") if out else ""

# ---- manual overrides: fully-English fields, or ones the extractor mangles ----
# Each value is the accurate romanization of that dua's Arabic.
AYAT_AL_KURSI = (
    "Allahu la ilaha illa huwal-hayyul-qayyoom, la ta-khuthuhu sinatun wala nawm, "
    "lahu ma fis-samawati wama fil-ard, man thal-lathee yashfa'u 'indahu illa bi-ithnih, "
    "ya'lamu ma bayna aydeehim wama khalfahum, wala yuheetoona bishay-in min 'ilmihi illa bima sha-a, "
    "wasi'a kursiyyuhus-samawati wal-ard, wala ya-ooduhu hifthuhuma, wahuwal-'aliyyul-'atheem."
)

OVERRIDES = {
    # Ayat al-Kursi — the source stored only the instruction "Recite Ayat-Al-Kursiy"
    "dua_001": "A'oothu billahi minash-shaytanir-rajeem. " + AYAT_AL_KURSI,
    "dua_023": AYAT_AL_KURSI,
    # the Arabic includes the repetition count, so the romanization keeps it too
    "dua_007": "Hasbiyal-lahu la ilaha illa huwa, 'alayhi tawakkalt, wahuwa rabbul-'arshil-'atheem. Sab'a marrat.",
    "dua_020": "Astaghfirul-laha wa-atoobu ilayh, mi-ata marratin fil-yawm.",
    "dua_022": "Allahumma salli wa sallim 'ala nabiyyina Muhammad, 'ashra marrat.",
    "dua_054": "Subhana rabbiyal-'atheem. Thalatha marrat.",
    "dua_084": "Astaghfirul-laha thalathan. Allahumma antas-salam, waminkas-salam, tabarakta ya thal-jalali wal-ikram.",
    "dua_114": "As-alul-lahal-'atheem rabbal-'arshil-'atheem an yashfiyak. Sab'a marrat.",
    "dua_013":"Asbahna wa-asbahal-mulku lillahi rabbil-'alameen, allahumma innee as-aluka khayra hathal-yawm, fat-hahu, wanasrahu, wanoorahu, wabarakatahu, wahudahu, wa-a'oothu bika min sharri ma feehi, washarri ma ba'dah.",
    "dua_044": "Wa-ana ashhadu an la ilaha illal-lahu wahdahu la shareeka lah, wa-anna Muhammadan 'abduhu warasooluh.",
    "dua_087": "Allahumma innee as-aluka 'ilman nafi'an, warizqan tayyiban, wa'amalan mutaqabbalan.",
    "dua_105": "Yasta'eethu billahi wa yantahi 'amma shakka feehi.",
    "dua_092": "Subhanal-malikil-quddoos. Rabbil-mala-ikati warrooh.",
    "dua_098": "La ilaha illa anta subhanaka innee kuntu minath-thalimeen.",
    "dua_102": "Allaahumma rabbas-samaawaatis-sab'i, wa rabbal-'arshil-'adheem, kun lee jaaran min fulani bni fulan wa 'ahzabihi min khalaa'iqika, an yafruta 'alayya ahadun minhum aw yatghaa, 'azza jaaruka, wa jalla thanaa'uka, wa laa ilaaha illaa ant.",
    "dua_106": "Amantu billahi warusulih.",
    "dua_119": "Allahummagh-fir li-fulanin warfa' darajatahu fil-mahdiyyeen, wakhlufhu fee 'aqibihi fil-ghabireen, waghfir lana walahu ya rabbal-'alameen, wafsah lahu fee qabrih, wanawwir lahu feeh.",
    "dua_122": "Allahumma inna fulana bna fulanin fee thimmatik, wahabli jiwarik, faqihi min fitnatil-qabri wa'athabin-nar, wa-anta ahlul-wafaa-i walhaqq, faghfir lahu warhamh, innaka antal-ghafoorur-raheem.",
    "dua_148": "Itha du'iya ahadukum falyujib, fa-in kana sa-iman falyusalli, wa-in kana muftiran falyat'am.",
    "dua_115": "La ilaha illal-lah, inna lilmawti lasakarat.",
    "dua_117": "Man kana akhira kalamihi la ilaha illal-lah, dakhalal-jannah.",
    "dua_151": "Alhamdu lillah. Yarhamukal-lah. Yahdeekumul-lahu wayuslihu balakum.",
    "dua_154": "Allahumma innee as-aluka khayraha wakhayra ma jabaltaha 'alayh, wa-a'oothu bika min sharriha washarri ma jabaltaha 'alayh.",
    "dua_165": "Wa feeka barakal-lah.",
    "dua_179": "Rabbana atina fid-dunya hasanatan wafil-akhirati hasanatan waqina 'athaban-nar.",
    "dua_191": "Subhanal-lah, walhamdu lillah, la ilaha illal-lah, wallahu akbar.",
    "dua_192": "Subhanal-lah, walhamdu lillah, la ilaha illal-lah, wallahu akbar.",
    "dua_195": "Subhanal-lah, walhamdu lillah, wala ilaha illal-lah, wallahu akbar.",
    "dua_199": "Subhanal-lah, walhamdu lillah, wala ilaha illal-lah, wallahu akbar, wala hawla wala quwwata illa billah.",
}

def norm(s):
    return re.sub(r"\s+", " ", s.strip().strip("'\" .")).lower()

def main():
    apply = "--apply" in sys.argv
    duas = json.load(open(BE, encoding="utf8"))
    changes = {}
    for d in duas:
        tr = d.get("transliteration", "") or ""
        if not tr.strip():
            continue
        new = OVERRIDES.get(d["id"])
        if not new:
            ex = extract(tr)
            # only change when the extractor actually removed non-romanized text
            if not ex.strip(".") or norm(ex) == norm(tr):
                continue
            new = ex
        if norm(new) == norm(tr):
            continue
        changes[d["id"]] = new
        print(d["id"], "=>", new)
    print("\n%d transliterations changed" % len(changes))

    if apply:
        for path in (BE, FE):
            data = json.load(open(path, encoding="utf8"))
            for d in data:
                if d["id"] in changes:
                    d["transliteration"] = changes[d["id"]]
            json.dump(data, open(path, "w", encoding="utf8"), ensure_ascii=False, indent=2)
        print("APPLIED to backend + frontend copies.")

if __name__ == "__main__":
    main()
