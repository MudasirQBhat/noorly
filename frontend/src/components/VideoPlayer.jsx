import { useEffect, useMemo, useRef, useState } from "react";
import Scene from "./Scenes.jsx";
import { Play, Pause, Repeat, Restart } from "./Icons.jsx";

const SPEEDS = [0.75, 1, 1.25];
const fmt = (ms) => {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

// remember-last-position helpers (per surah / dua)
const posKey = (id) => `noorly:pos:${id}`;
const readPos = (id) => { try { return Number(localStorage.getItem(posKey(id))) || 0; } catch { return 0; } };
const writePos = (id, ms) => { try { localStorage.setItem(posKey(id), String(Math.round(ms))); } catch {} };

// Unified inline "video": animated scene + audio + karaoke subtitles + controls.
export default function VideoPlayer({ media, onEnded, autoStart, autoplay }) {
  const frameRef = useRef(null);
  const audioRef = useRef(null);
  const rafRef = useRef(0);
  const autoStartedRef = useRef(false);

  const [playing, setPlaying] = useState(false);
  const [currentMs, setCurrentMs] = useState(media.audioStartMs || 0);
  const [speed, setSpeed] = useState(1);
  const [loop, setLoop] = useState(false); // repeat off by default (autoplay handles "next")
  const [loopLine, setLoopLine] = useState(false);
  const [ended, setEnded] = useState(false);
  const [audioErr, setAudioErr] = useState(false);
  const [effEndMs, setEffEndMs] = useState(media.audioEndMs || media.durationMs || 0);
  const [ready, setReady] = useState(false);
  const [full, setFull] = useState(false);
  const [started, setStarted] = useState(false);
  const [imgErr, setImgErr] = useState(() => new Set());
  const [imgStack, setImgStack] = useState([]);
  const [controlsOn, setControlsOn] = useState(true);
  const hideRef = useRef(0);
  const overControls = useRef(false);
  const resumeRef = useRef(0);
  const lastSaveRef = useRef(0);

  const startMs = media.audioStartMs || 0;

  // reset when media changes; load any saved resume position
  useEffect(() => {
    setPlaying(false); setStarted(false); setReady(false); setLoopLine(false); setEnded(false); setAudioErr(false);
    setCurrentMs(media.audioStartMs || 0);
    setEffEndMs(media.audioEndMs || media.durationMs || 0);
    setLoop(false);
    resumeRef.current = media.id ? readPos(media.id) : 0;
    autoStartedRef.current = false;
  }, [media]);

  function pickActive(cues) {
    let c = cues[0];
    if (media.hasWordTiming) {
      for (let i = 0; i < cues.length; i++) {
        if (currentMs >= cues[i].startMs && currentMs < cues[i].endMs) { c = cues[i]; break; }
        if (currentMs >= cues[i].startMs) c = cues[i];
      }
    }
    return c;
  }
  const active = useMemo(() => {
    const arabic = pickActive(media.arabicCues);
    const english = pickActive(media.englishCues);
    const themeCue = pickActive(media.themeCues || []);
    const word = (media.hasWordTiming && arabic)
      ? arabic.words.find((w) => currentMs >= w.startMs && currentMs < w.endMs) || null
      : null;
    return { arabic, english, word, image: themeCue?.image };
  }, [currentMs, media]);

  const base = startMs;
  const span = (effEndMs || media.durationMs || 1) - base;

  // the ayah range containing a given time (for "repeat this line")
  function ayahRange(ms) {
    const tc = media.themeCues || [];
    let r = null;
    for (const c of tc) { if (ms >= c.startMs && ms < c.endMs) { r = c; break; } if (ms >= c.startMs) r = c; }
    if (r && r.endMs > r.startMs) return [r.startMs, r.endMs];
    return [base, effEndMs || span + base];
  }

  useEffect(() => {
    if (!playing) return;
    const tick = () => {
      const a = audioRef.current;
      if (a) {
        const ms = a.currentTime * 1000;
        if (loopLine) {
          const [ls, le] = ayahRange(ms);
          if (le && ms >= le - 20) { a.currentTime = ls / 1000; setCurrentMs(ls); }
          else setCurrentMs(ms);
        } else {
          const end = effEndMs || (a.duration ? a.duration * 1000 : 0);
          if (end && ms >= end - 20) {
            if (loop) { a.currentTime = startMs / 1000; setCurrentMs(startMs); }
            else {
              a.pause(); setPlaying(false); a.currentTime = startMs / 1000; setCurrentMs(startMs);
              if (media.id) writePos(media.id, 0);
              setEnded(true);
              onEnded?.();
              return;
            }
          } else setCurrentMs(ms);
        }
        // throttled position save
        if (media.id && ms > startMs + 1000 && Date.now() - lastSaveRef.current > 2000) {
          lastSaveRef.current = Date.now(); writePos(media.id, ms);
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing, loop, loopLine, effEndMs, startMs, media]);

  useEffect(() => { if (audioRef.current) audioRef.current.playbackRate = speed; }, [speed, ready]);

  useEffect(() => {
    const src = active.image;
    if (!src) return;
    setImgStack((s) => (s[s.length - 1] === src ? s : [...s, src].slice(-2)));
  }, [active.image]);
  useEffect(() => {
    const onFs = () => {
      const isFull = document.fullscreenElement === frameRef.current;
      setFull(isFull);
      // release the landscape lock whenever we leave fullscreen (incl. system back)
      if (!isFull) { try { screen.orientation?.unlock?.(); } catch {} }
    };
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  function onLoaded() {
    const a = audioRef.current; if (!a) return;
    const eff = effEndMs || (a.duration ? a.duration * 1000 : 0);
    if (!effEndMs && a.duration) setEffEndMs(a.duration * 1000);
    const r = resumeRef.current;
    if (r && r > startMs + 3000 && (!eff || r < eff - 3000)) { a.currentTime = r / 1000; setCurrentMs(r); }
    else if (startMs > 0) { a.currentTime = startMs / 1000; setCurrentMs(startMs); }
    setReady(true);
    // auto-start when arriving via autoplay-next (page already has user interaction)
    if (autoStart && !autoStartedRef.current) {
      autoStartedRef.current = true;
      setStarted(true); setPlaying(true);
      a.play().catch(() => setPlaying(false));
    }
  }
  function togglePlay() {
    const a = audioRef.current; if (!a) return;
    setStarted(true); setEnded(false);
    if (playing) { a.pause(); setPlaying(false); if (media.id) writePos(media.id, currentMs); return; }
    if (effEndMs && a.currentTime * 1000 >= effEndMs - 30) { a.currentTime = startMs / 1000; setCurrentMs(startMs); }
    setPlaying(true); a.play().catch(() => setPlaying(false));
  }
  function replay() {
    const a = audioRef.current; if (!a) return;
    a.currentTime = startMs / 1000; setCurrentMs(startMs);
    setEnded(false); setStarted(true); setPlaying(true);
    a.play().catch(() => setPlaying(false));
  }
  function restart() { const a = audioRef.current; if (a) { a.currentTime = startMs / 1000; setCurrentMs(startMs); } }
  async function toggleFull() {
    try {
      if (document.fullscreenElement) {
        try { screen.orientation?.unlock?.(); } catch {}
        await document.exitFullscreen();
      } else {
        await frameRef.current?.requestFullscreen?.();
        // On phones, rotate to landscape 16:9 like YouTube. Rejects harmlessly
        // on desktop and iOS Safari (which don't support orientation lock).
        try { await screen.orientation?.lock?.("landscape"); } catch {}
      }
    } catch {}
  }
  function seekLine(dir) {
    const cues = media.arabicCues; if (!cues.length) return;
    let idx = 0;
    for (let i = 0; i < cues.length; i++) if (currentMs >= cues[i].startMs - 1) idx = i;
    const ni = Math.min(cues.length - 1, Math.max(0, idx + dir));
    const ms = cues[ni].startMs;
    const a = audioRef.current; if (a) a.currentTime = ms / 1000; setCurrentMs(ms);
  }
  function enableLoop() { setLoop((v) => { if (!v) setLoopLine(false); return !v; }); }
  function enableLoopLine() { setLoopLine((v) => { if (!v) setLoop(false); return !v; }); }

  // keyboard shortcuts: space = play/pause, ←/→ = previous/next line, f = fullscreen
  useEffect(() => {
    const onKey = (e) => {
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.code === "Space") { e.preventDefault(); togglePlay(); }
      else if (e.code === "ArrowLeft") { e.preventDefault(); seekLine(-1); }
      else if (e.code === "ArrowRight") { e.preventDefault(); seekLine(1); }
      else if (e.key === "f" || e.key === "F") { toggleFull(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // ---- controls auto-hide ----
  function showControls() {
    setControlsOn(true);
    clearTimeout(hideRef.current);
    if (playing && !overControls.current) hideRef.current = setTimeout(() => setControlsOn(false), 2600);
  }
  function leaveFrame() {
    clearTimeout(hideRef.current);
    if (playing && !overControls.current) setControlsOn(false);
  }
  useEffect(() => {
    clearTimeout(hideRef.current);
    if (playing) hideRef.current = setTimeout(() => { if (!overControls.current) setControlsOn(false); }, 2600);
    else setControlsOn(true);
    return () => clearTimeout(hideRef.current);
  }, [playing]);

  const pct = span > 0 ? Math.min(100, Math.max(0, ((currentMs - base) / span) * 100)) : 0;
  const cue = active.arabic;
  const english = active.english;
  const lit = playing && !media.hasWordTiming;
  // The recitation is streamed from an external host. If it fails we must say so —
  // otherwise `ready` never flips and the spinner runs forever.
  const loading = !!media.audioUrl && !ready && !audioErr;

  function retryAudio() {
    const a = audioRef.current; if (!a) return;
    setAudioErr(false); setReady(false); setPlaying(false);
    a.load();
  }

  return (
    <div className={`video ${full ? "is-full" : ""} ${controlsOn ? "" : "controls-hidden"}`} ref={frameRef}
      onMouseMove={showControls} onMouseLeave={leaveFrame} onTouchStart={showControls}>
      <Scene type={media.scene} />
      {imgStack.filter((src) => !imgErr.has(src)).map((src, i) => (
        <img key={src} className="video-img" alt="" aria-hidden="true"
          src={src} style={{ zIndex: 1 + i }}
          onError={() => setImgErr((s) => new Set(s).add(src))} />
      ))}
      <div className="video-veil" />
      <audio ref={audioRef} src={media.audioUrl} preload="auto" onLoadedMetadata={onLoaded}
        onCanPlay={() => { setReady(true); setAudioErr(false); }}
        onError={() => { setAudioErr(true); setPlaying(false); }}
        onEnded={() => { if (!loop && !loopLine) { setPlaying(false); if (media.id) writePos(media.id, 0); setEnded(true); onEnded?.(); } }} />

      {loading && (
        <div className="video-loading" aria-live="polite"><span className="v-spinner" /><span className="v-loading-txt">Loading…</span></div>
      )}

      {audioErr && (
        <div className="video-error" role="alert">
          <span className="v-err-ic" aria-hidden="true">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3v11M8 6.5 12 3l4 3.5" opacity="0" /><circle cx="12" cy="12" r="9" /><path d="M12 8v4.5M12 16h.01" />
            </svg>
          </span>
          <p className="v-err-txt">Couldn't load the recitation</p>
          <p className="v-err-sub">Please check your connection and try again.</p>
          <button className="v-err-btn" onClick={retryAudio}>Try again</button>
        </div>
      )}

      {/* subtitle stage */}
      <div className="video-stage" onClick={togglePlay} role="button" aria-label={playing ? "Pause" : "Play"}>
        {cue?.label && <div className="v-label">{cue.label}</div>}
        <div className="v-cue" key={cue?.startMs ?? 0}>
          <div className="v-arabic" lang="ar">
            {cue?.words.map((w, i) => {
              const isActive = media.hasWordTiming && active.word === w;
              const done = media.hasWordTiming && currentMs >= w.endMs && w.endMs > 0;
              return <span key={i} className={`v-word ${isActive ? "active" : ""} ${done && !isActive ? "done" : ""} ${lit ? "lit" : ""}`}>{w.arabic}</span>;
            })}
          </div>
          {cue?.translit && <div className="v-translit">{cue.translit}</div>}
        </div>
        {english?.text && <div className="v-translation" key={"t" + (english?.startMs ?? 0)}>{english.text}</div>}
      </div>

      {!started && !loading && !audioErr && (
        <button className="v-bigplay" onClick={togglePlay} aria-label="Play">
          <Play width={40} height={40} />
        </button>
      )}

      {/* game-style "watch again" prompt — only when finished and autoplay is off */}
      {ended && !autoplay && !loading && !audioErr && (
        <button className="v-replay" onClick={replay} aria-label="Watch again">
          <span className="v-replay-ring">
            <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" />
            </svg>
          </span>
          <span className="v-replay-txt">Watch again</span>
          <span className="v-replay-sub">{media.kind === "dua" ? "Tap to hear the dua again" : "Tap to hear it again"}</span>
        </button>
      )}

      {/* controls bar */}
      <div className="video-controls"
        onMouseEnter={() => { overControls.current = true; clearTimeout(hideRef.current); setControlsOn(true); }}
        onMouseLeave={() => { overControls.current = false; showControls(); }}>
        <div className="v-progress" data-tip="Jump to a point" onClick={(e) => {
          const a = audioRef.current; if (!a) return;
          const r = e.currentTarget.getBoundingClientRect();
          const p = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
          const ms = base + p * span; a.currentTime = ms / 1000; setCurrentMs(ms);
        }}>
          <div className="v-progress-fill" style={{ width: `${pct}%` }} />
        </div>
        <div className="v-btnrow">
          <button className="v-ic" data-tip={playing ? "Pause" : "Play"} onClick={togglePlay} aria-label={playing ? "Pause" : "Play"}>{playing ? <Pause /> : <Play />}</button>
          <button className="v-ic" data-tip="Start again" onClick={restart} aria-label="Restart"><Restart /></button>
          <button className={`v-ic ${loop ? "on" : ""}`} data-tip={loop ? "Repeat: on" : "Repeat all"} onClick={enableLoop} aria-pressed={loop} aria-label="Repeat all"><Repeat /></button>
          <button className={`v-ic v-loopline ${loopLine ? "on" : ""}`} data-tip="Repeat this line" onClick={enableLoopLine} aria-pressed={loopLine} aria-label="Repeat this line">
            <Repeat /><span className="v-one">1</span>
          </button>
          <span className="v-time" data-tip="Time · total">{fmt(currentMs - base)} / {fmt(span)}</span>
          <span className="v-flex" />
          <span className="v-speeds">
            {SPEEDS.map((s) => (
              <button key={s} className={speed === s ? "active" : ""} data-tip={s === 1 ? "Normal speed" : s < 1 ? "Slower" : "Faster"}
                onClick={() => setSpeed(s)} aria-pressed={speed === s}>{s}×</button>
            ))}
          </span>
          <button className="v-ic tip-end" data-tip={full ? "Exit full screen" : "Full screen"} onClick={toggleFull} aria-label={full ? "Exit full screen" : "Full screen"}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
