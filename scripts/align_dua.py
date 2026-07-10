#!/usr/bin/env python3
"""Forced-ish alignment for a single dua using faster-whisper word timestamps.

Usage:
  python scripts/align_dua.py <dua_id> [--model small] [--write]

Downloads the dua's audio, (optionally trims to its [audioStart,audioEnd] window
for chapter-scoped audio), runs Whisper with word timestamps in Arabic, and maps
the recognised words onto the dua's known Arabic tokens. Prints the result; with
--write it saves start/end back into backend/data/dua.json and sets hasWordTiming.
"""
import json, sys, subprocess, tempfile, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "backend", "data", "dua.json")
# the frontend bundles its own copy; keep both in sync on write
FE_DATA = os.path.join(ROOT, "frontend", "src", "data", "dua.json")

def sh(*a):
    subprocess.run(a, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

# Strip tashkeel/punctuation and normalise alef/ya/ta-marbuta for matching.
import re
_DIAC = re.compile(r"[ؐ-ًؚ-ٰٟۖ-ۭـ]")
def norm(s):
    s = _DIAC.sub("", s)
    s = s.translate(str.maketrans("إأآاىﻻ", "اااايل"))
    return re.sub(r"[^؀-ۿ]", "", s)

def main():
    dua_id = sys.argv[1]
    model_name = "small"
    write = "--write" in sys.argv
    if "--model" in sys.argv:
        model_name = sys.argv[sys.argv.index("--model") + 1]
    url_override = sys.argv[sys.argv.index("--url") + 1] if "--url" in sys.argv else None
    ss = float(sys.argv[sys.argv.index("--ss") + 1]) if "--ss" in sys.argv else None
    to = float(sys.argv[sys.argv.index("--to") + 1]) if "--to" in sys.argv else None
    ntokens = int(sys.argv[sys.argv.index("--ntokens") + 1]) if "--ntokens" in sys.argv else None

    duas = json.load(open(DATA, encoding="utf8"))
    d = next(x for x in duas if x["id"] == dua_id)
    if url_override:
        d["audioUrl"] = url_override
    a_start = float(d.get("audioStart") or 0)
    a_end = float(d.get("audioEnd") or 0)
    chapter = d.get("audioScope") == "chapter"
    # explicit --ss/--to force a transcription window (e.g. to isolate a dua
    # inside a shared chapter recording); overrides the stored audio window.
    if ss is not None:
        a_start, a_end, chapter = ss, (to if to is not None else a_end), True
    tokens = d["arabic"].split()
    if ntokens:  # align only the first N tokens (dual-form duas: recite one form)
        tokens = tokens[:ntokens]
    print(f"{dua_id} | scope={d.get('audioScope')} | window=[{a_start},{a_end}] | tokens={len(tokens)}")

    tmp = tempfile.mkdtemp()
    raw = os.path.join(tmp, "in.mp3"); wav = os.path.join(tmp, "in.wav")
    sh("curl", "-sL", "--max-time", "120", "-A", "Mozilla/5.0", "-o", raw, d["audioUrl"])
    # trim to the dua window for chapter audio; else use whole clip
    trim = ["-ss", str(a_start), "-to", str(a_end)] if (chapter and a_end > a_start) else []
    sh("ffmpeg", "-y", *trim, "-i", raw, "-ac", "1", "-ar", "16000", wav)
    offset = a_start if trim else 0.0

    from faster_whisper import WhisperModel
    model = WhisperModel(model_name, device="cpu", compute_type="int8")
    segments, _ = model.transcribe(wav, language="ar", word_timestamps=True, vad_filter=True)
    wwords = []
    for seg in segments:
        for w in (seg.words or []):
            wwords.append((w.word.strip(), round(float(w.start) + offset, 2), round(float(w.end) + offset, 2)))
    print(f"whisper recognised {len(wwords)} words; dua has {len(tokens)} tokens")
    for w in wwords:
        print("   ", w)

    if not wwords:
        print("!! no words recognised — leaving as-is"); return

    wnorm = [norm(w[0]) for w in wwords]
    tnorm = [norm(t) for t in tokens]
    # find the offset where our tokens best line up with recognised words — this
    # skips any spoken intro ("du'a'u-l-khawf… you say:") before the dua itself.
    best_off, best_score = 0, -1
    for off in range(0, max(1, len(wwords) - 1)):
        score = sum(
            1 for k in range(min(len(tnorm), len(wwords) - off))
            if tnorm[k] and wnorm[off + k] and (tnorm[k] == wnorm[off + k] or tnorm[k] in wnorm[off + k] or wnorm[off + k] in tnorm[k])
        )
        if score > best_score:
            best_score, best_off = score, off
    avail = wwords[best_off: best_off + len(tokens)]
    print(f"\nalign offset={best_off} (skipped {best_off} intro word(s)), matched≈{best_score}/{len(tokens)}")

    if len(avail) == len(tokens):
        mapped = [(tokens[i], avail[i][1], avail[i][2]) for i in range(len(tokens))]
        how = "1:1 recognised-word timings"
    else:
        s0 = avail[0][1] if avail else wwords[best_off][1]
        s1 = avail[-1][2] if avail else wwords[-1][2]
        span = max(0.4, s1 - s0); step = span / len(tokens)
        mapped = [(tokens[i], round(s0 + step * i, 2), round(s0 + step * (i + 1), 2)) for i in range(len(tokens))]
        how = f"proportional over [{s0},{s1}] (audio had {len(avail)} of {len(tokens)} words)"
    new_start, new_end = mapped[0][1], mapped[-1][2]
    print(f"mapping: {how}\naudio window -> [{new_start}, {new_end}]")
    for m in mapped:
        print("   ", m)

    if write:
        d["words"] = [{"arabic": t, "transliteration": "", "start": s, "end": e} for (t, s, e) in mapped]
        d["hasWordTiming"] = True
        d["audioStart"] = new_start
        d["audioEnd"] = new_end
        json.dump(duas, open(DATA, "w", encoding="utf8"), ensure_ascii=False, indent=2)
        # mirror the same fields into the frontend's bundled copy
        if os.path.exists(FE_DATA):
            fe = json.load(open(FE_DATA, encoding="utf8"))
            for x in fe:
                if x["id"] == dua_id:
                    for f in ("words", "hasWordTiming", "audioUrl", "audioStart", "audioEnd", "transliteration", "translationEn"):
                        x[f] = d[f]
            json.dump(fe, open(FE_DATA, "w", encoding="utf8"), ensure_ascii=False, indent=2)
        print(f"\n✓ wrote timings + audio window for {dua_id} (url={d['audioUrl'].split('/')[-1]})")

if __name__ == "__main__":
    main()
