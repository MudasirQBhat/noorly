import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { adminUrl, getDua, getDuas, getSurah, getSurahs } from "../lib/api.js";
import VideoPlayer from "../components/VideoPlayer.jsx";
import { duaToCinema, surahToCinema } from "../lib/cinema.js";
import { CategoryGlyph } from "../components/Pattern.jsx";
import { useAdmin } from "../lib/admin.jsx";

function DownloadIcon() {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14" /></svg>;
}

export default function Watch({ kind }) {
  const params = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const autoStart = location.state?.auto === true; // arrived here via autoplay-next
  const { admin, token } = useAdmin();
  const [rendering, setRendering] = useState(false);

  async function downloadVideo() {
    if (rendering) return;
    setRendering(true);
    try {
      const idPart = kind === "surah" ? item.number : item.id;
      const res = await fetch(adminUrl(`/api/admin/render?type=${kind}&id=${encodeURIComponent(idPart)}&token=${encodeURIComponent(token)}`));
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Render failed");
      const blob = await res.blob();
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = `${(kind === "surah" ? item.nameEn : item.titleEn).replace(/[^a-z0-9 _-]/gi, "").trim()}.mp4`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(href);
    } catch (e) {
      alert("Couldn't render the video: " + (e.message || "try again"));
    } finally {
      setRendering(false);
    }
  }
  const [item, setItem] = useState(null);
  const [media, setMedia] = useState(null);
  const [related, setRelated] = useState([]);
  const [missing, setMissing] = useState(false);
  const [next, setNext] = useState(null); // { href, title }

  const [autoplay, setAutoplay] = useState(() => {
    try { return localStorage.getItem("noorly:autoplay") === "1"; } catch { return false; }
  });
  useEffect(() => { try { localStorage.setItem("noorly:autoplay", autoplay ? "1" : "0"); } catch {} }, [autoplay]);

  // stable onEnded that always reads the latest autoplay + next
  const autoplayRef = useRef(autoplay); autoplayRef.current = autoplay;
  const nextRef = useRef(next); nextRef.current = next;
  const handleEnded = useCallback(() => {
    if (autoplayRef.current && nextRef.current) navigate(nextRef.current.href, { state: { auto: true } });
  }, [navigate]);

  useEffect(() => {
    let alive = true;
    setItem(null); setMedia(null); setMissing(false); setRelated([]); setNext(null);
    if (kind === "dua") {
      getDua(params.id).then((d) => {
        if (!alive) return;
        if (!d) return setMissing(true);
        setItem(d); setMedia(duaToCinema(d));
        getDuas().then((all) => {
          if (!alive) return;
          setRelated(all.filter((x) => x.category === d.category && x.id !== d.id).slice(0, 6));
          const i = all.findIndex((x) => x.id === d.id);
          const nx = i >= 0 ? all[i + 1] : null;
          setNext(nx ? { href: `/watch/dua/${nx.id}`, title: nx.titleEn } : null);
        });
      });
    } else {
      getSurah(params.number).then((s) => {
        if (!alive) return;
        if (!s) return setMissing(true);
        setItem(s); setMedia(surahToCinema(s));
        getSurahs().then((all) => {
          if (!alive) return;
          const i = all.findIndex((x) => String(x.number) === String(s.number));
          const nx = i >= 0 ? all[i + 1] : null;
          setNext(nx ? { href: `/watch/surah/${nx.number}`, title: nx.nameEn } : null);
        });
      });
    }
    return () => { alive = false; };
  }, [kind, params.id, params.number]);

  if (missing) return <div className="watch"><p className="empty">Couldn't find that. <Link to="/">Go home</Link></p></div>;
  if (!item || !media) return <div className="watch"><div className="video-skeleton" /><p className="loading">Loading…</p></div>;

  return (
    <div className="watch">
      <VideoPlayer key={media.id} media={media} onEnded={handleEnded} autoStart={autoStart} autoplay={autoplay} />

      <div className="watch-controls">
        <label className="autoplay-toggle" title="When on, the next one plays automatically">
          <input type="checkbox" checked={autoplay} onChange={(e) => setAutoplay(e.target.checked)} />
          <span className="autoplay-switch" />
          Autoplay next{next ? <> · <span style={{ color: "var(--teal)" }}>up next: {next.title}</span></> : ""}
        </label>
        {admin && (
          <button className="admin-dl-btn" onClick={downloadVideo} disabled={rendering}>
            {rendering ? <span className="dl-spin" /> : <DownloadIcon />}
            {rendering ? "Rendering video…" : "Download video"}
          </button>
        )}
        <span className="watch-shortcuts">
          <kbd>Space</kbd> play/pause · <kbd>←</kbd><kbd>→</kbd> prev/next line · <kbd>F</kbd> full screen
        </span>
      </div>

      <div className="watch-info">
        <h1 className="watch-title">{item.titleEn ?? item.nameEn}</h1>
        <div className="watch-meta">
          {kind === "dua"
            ? <>{item.category} · <span className="ref">{item.reference}</span>{item.audioReciter ? <> · recited by {item.audioReciter}</> : null}</>
            : <>{item.nameTranslation} · {item.numberOfAyahs} ayahs · {item.revelationType} · recited by {item.reciter}</>}
        </div>

        {kind === "dua" && (
          <div className="watch-text card">
            <p className="arabic-flow" lang="ar">{item.arabic}</p>
            <p className="translit">{item.transliteration}</p>
            <p className="translation">{item.translationEn}</p>
            {!media.hasWordTiming && (
              <p className="watch-hint">Tip: press play and listen — repeat is on by default so it loops while you memorize.</p>
            )}
          </div>
        )}

        {kind === "surah" && (
          <details className="watch-transcript" open>
            <summary>Full text &amp; translation</summary>
            {item.ayahs.map((a) => (
              <div className="ayah-block" key={a.numberInSurah}>
                <div className="ayah-meta"><span className="ayah-num">{a.numberInSurah}</span></div>
                <p className="arabic-flow" lang="ar">{a.arabic}</p>
                <p className="translit">{a.transliteration}</p>
                <p className="translation">{a.translationEn}</p>
              </div>
            ))}
          </details>
        )}
      </div>

      {related.length > 0 && (
        <div className="watch-related">
          <h2>More in {item.category}</h2>
          <div className="related-list">
            {related.map((d) => (
              <Link key={d.id} to={`/watch/dua/${d.id}`} className="related-card">
                <span className="related-glyph"><CategoryGlyph name={d.category} size={22} /></span>
                <span>
                  <span className="related-title">{d.titleEn}</span>
                  <span className="related-sub">{d.reference}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
