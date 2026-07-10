import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Logo from "../components/Logo.jsx";
import SupportButton from "../components/SupportButton.jsx";
import Footer from "../components/Footer.jsx";
import { ArabesqueDivider } from "../components/Pattern.jsx";
import { Play, Book, Star } from "../components/Icons.jsx";

// Reveal-on-scroll: adds .in when an element enters the viewport. Elements already
// in/above the viewport on load reveal immediately, so nothing stays hidden.
function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    root.classList.add("reveal-on"); // gate the hidden state on JS being active
    const els = [...root.querySelectorAll("[data-reveal]")];
    const vh = window.innerHeight;
    els.forEach((el) => { if (el.getBoundingClientRect().top < vh * 0.9) el.classList.add("in"); });
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("in")),
      { threshold: 0.12 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return ref;
}

const FEATURES = [
  { icon: "video", title: "Watch like a video", text: "Every dua and surah plays as a calm animated scene with the recitation — learning that feels like a story, not a lesson." },
  { icon: "words", title: "Word-by-word highlighting", text: "The Arabic lights up in time with the real recitation, with transliteration and English subtitles, one gentle line at a time." },
  { icon: "book", title: "Authentic & complete", text: "199 duas from Hisnul Muslim across 14 everyday moments, plus Surah Al-Fatiha and all 37 surahs of Juz 30 — from trusted sources." },
  { icon: "heart", title: "Calm, safe & ad-free", text: "No ads and no gimmicks — just calm, child-friendly visuals: serene landscapes for the surahs, and gentle, modestly-dressed scenes of a young child for the duas." },
];

const STEPS = [
  { n: "1", title: "Pick", text: "Choose any dua or surah from the menu." },
  { n: "2", title: "Watch & listen", text: "Follow the glowing words and the calm scene." },
  { n: "3", title: "Repeat & memorize", text: "Loop it at your own pace until it sticks." },
];

// Playback tools built into every video — the memorization helpers.
const TOOLS = [
  { icon: "repeatOne", title: "Repeat one line", text: "Loop a single ayah or dua line — the classic way to memorize, one line at a time." },
  { icon: "repeat", title: "Repeat the whole thing", text: "Play a full surah or dua on a loop until it sticks." },
  { icon: "next", title: "Autoplay next", text: "Flows straight into the next surah or dua, completely hands-free." },
  { icon: "speed", title: "Slow it down", text: "Drop to 0.75× to catch every letter, or speed up to 1.25× to review." },
  { icon: "words", title: "Word-by-word glow", text: "Every word lights up in time with the reciter, so eyes and ears stay together." },
  { icon: "letters", title: "Read it in English letters", text: "Transliteration and the English meaning sit right under the Arabic." },
  { icon: "bookmark", title: "Remembers where you stopped", text: "Stop watching any time — when you open the same dua or surah again, it continues from the exact spot you left, so you never start over." },
  { icon: "search", title: "Search for any dua or surah", text: "Type a name in the search box at the top of the side menu to jump straight to the dua or surah you want." },
];

function FeatureIcon({ kind }) {
  const p = { width: 30, height: 30, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.9, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };
  if (kind === "video") return <svg {...p}><rect x="3" y="5" width="18" height="14" rx="3" /><path d="M10 9l5 3-5 3z" fill="currentColor" stroke="none" /></svg>;
  if (kind === "words") return <svg {...p}><path d="M4 7h16M4 12h10M4 17h7" /><circle cx="17" cy="15" r="3" /></svg>;
  if (kind === "book") return <svg {...p}><path d="M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2z" /><path d="M18 3v18" /></svg>;
  return <svg {...p}><path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z" /></svg>;
}

function ToolIcon({ kind }) {
  const p = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };
  if (kind === "repeatOne") return <svg {...p}><path d="M17 2l3 3-3 3" /><path d="M20 5H8a4 4 0 0 0-4 4v1" /><path d="M7 22l-3-3 3-3" /><path d="M4 19h12a4 4 0 0 0 4-4v-1" /><text x="12" y="15.5" fontSize="7.5" fontWeight="800" fill="currentColor" stroke="none" textAnchor="middle">1</text></svg>;
  if (kind === "repeat") return <svg {...p}><path d="M17 2l3 3-3 3" /><path d="M20 5H8a4 4 0 0 0-4 4v1" /><path d="M7 22l-3-3 3-3" /><path d="M4 19h12a4 4 0 0 0 4-4v-1" /></svg>;
  if (kind === "next") return <svg {...p}><path d="M6 5l9 7-9 7z" fill="currentColor" stroke="none" /><path d="M18 5v14" /></svg>;
  if (kind === "speed") return <svg {...p}><path d="M4 18a8 8 0 1 1 16 0" /><path d="M12 14l4-3" /></svg>;
  if (kind === "words") return <svg {...p}><path d="M4 7h16M4 12h10M4 17h7" /><circle cx="17.5" cy="15" r="3" /></svg>;
  if (kind === "letters") return <svg {...p}><text x="12" y="17" fontSize="15" fontWeight="800" fontFamily="Georgia, serif" fill="currentColor" stroke="none" textAnchor="middle">Aa</text></svg>;
  if (kind === "bookmark") return <svg {...p}><path d="M6 3h12v18l-6-4-6 4z" /></svg>;
  return <svg {...p}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>;
}

export default function Landing() {
  const ref = useReveal();
  const videoRef = useRef(null);
  const [muted, setMuted] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduce) v.play?.().catch(() => {});
  }, []);

  function toggleSound() {
    const v = videoRef.current;
    if (!v) return;
    if (muted) { v.muted = false; v.currentTime = 0; v.play?.().catch(() => {}); setMuted(false); }
    else { v.muted = true; setMuted(true); }
  }

  return (
    <div className="landing" ref={ref}>
      {/* animated backdrop */}
      <div className="lx-bg" aria-hidden="true">
        <div className="lx-wash lx-wash-a" />
        <div className="lx-wash lx-wash-b" />
        <svg className="lx-stars" viewBox="0 0 100 60" preserveAspectRatio="xMidYMid slice">
          <g className="lx-crescent" transform="translate(86 12)">
            <circle r="6" fill="#e9c876" opacity="0.85" /><circle cx="2.4" cy="-1.4" r="5" fill="#faf3e4" />
          </g>
          {[[8,14,1.1,0],[18,30,0.8,1],[30,10,1.3,2],[44,22,0.7,3],[60,12,1,4],[70,32,0.9,1.5],[13,44,1,2.5],[52,40,0.8,3.5],[78,20,1.1,0.5],[92,38,0.9,2]].map(([x,y,r,d],i)=>(
            <path key={i} className="lx-tw" style={{ animationDelay:`${d}s` }} transform={`translate(${x} ${y})`}
              d={`M0 ${-r*2} L${r*0.5} ${-r*0.5} L${r*2} 0 L${r*0.5} ${r*0.5} L0 ${r*2} L${-r*0.5} ${r*0.5} L${-r*2} 0 L${-r*0.5} ${-r*0.5} Z`} fill="#d8a53a" />
          ))}
        </svg>
      </div>

      {/* sticky nav */}
      <header className="lx-header">
        <div className="lx-nav">
          <div className="lx-brand"><Logo size={40} /><span className="brand-name">Noor<span>ly</span></span></div>
          <button className="lx-burger" onClick={() => setMenuOpen((v) => !v)} aria-label="Menu" aria-expanded={menuOpen}>
            {menuOpen
              ? <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
              : <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" /></svg>}
          </button>
          <nav className={`lx-links ${menuOpen ? "open" : ""}`} onClick={() => setMenuOpen(false)}>
            <SupportButton />
            <Link to="/about">Credits</Link>
            <Link to="/watch/surah/1" className="btn btn-primary lx-cta-sm">Start learning</Link>
          </nav>
        </div>
      </header>

      {/* hero */}
      <section className="lx-hero">
        <div className="lx-hero-text">
          <span className="lx-eyebrow" data-reveal>✦ For young hearts learning the Qur'an</span>
          <h1 data-reveal>Watch, listen &amp; <span className="accent">memorize</span> — the joyful way</h1>
          <p className="lx-arabic" lang="ar" data-reveal>ٱقْرَأْ بِٱسْمِ رَبِّكَ</p>
          <p className="lx-sub" data-reveal>
            Noorly turns authentic duas, Surah Al-Fatiha and all the surahs of Juz 30 into
            gentle little videos — a calm scene, the real recitation, and the words glowing
            along with subtitles. Built for kids, loved at any age.
          </p>
          <div className="lx-cta" data-reveal>
            <Link to="/watch/surah/1" className="btn btn-primary lx-big"><Book width={18} height={18} /> Start learning</Link>
            <Link to="/watch/dua/dua_001" className="btn btn-ghost lx-big"><Star width={18} height={18} /> Explore duas</Link>
          </div>
          <div className="lx-stats" data-reveal>
            <div><b>199</b><span>duas</span></div>
            <div><b>38</b><span>surahs</span></div>
            <div><b>word</b><span>by word</span></div>
          </div>
        </div>

        {/* hero welcome video */}
        <div className="lx-preview" data-reveal>
          <div className="lx-video-frame">
            <video ref={videoRef} className="lx-video" src="/noorly.mp4" poster="/noorly-poster.jpg"
              loop playsInline preload="metadata" onClick={toggleSound} />
            <button className={`lx-unmute ${muted ? "" : "on"}`} onClick={toggleSound}
              title={muted ? "Tap to hear the greeting" : "Mute"}
              aria-label={muted ? "Play the greeting with sound" : "Mute the greeting"}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="9" y="2.5" width="6" height="11" rx="3" />
                <path d="M6 11a6 6 0 0 0 12 0" />
                <path d="M12 17v4M9 21h6" />
                {muted && <path d="M4 3l16 18" />}
              </svg>
            </button>
          </div>
          <div className="lx-preview-glow" />
        </div>
      </section>

      <ArabesqueDivider />

      {/* features */}
      <section className="lx-section">
        <h2 className="lx-h2" data-reveal>Why kids love learning here</h2>
        <div className="lx-features">
          {FEATURES.map((f, i) => (
            <div className="lx-feature" data-reveal style={{ transitionDelay: `${i * 80}ms` }} key={f.title}>
              <span className="lx-feature-ic"><FeatureIcon kind={f.icon} /></span>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* memorization tools */}
      <section className="lx-section">
        <h2 className="lx-h2" data-reveal>Little tools that make memorizing easier</h2>
        <div className="lx-tools">
          {TOOLS.map((t, i) => (
            <div className="lx-tool" data-reveal style={{ transitionDelay: `${i * 55}ms` }} key={t.title}>
              <span className="lx-tool-ic"><ToolIcon kind={t.icon} /></span>
              <div>
                <h4>{t.title}</h4>
                <p>{t.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* how it works */}
      <section className="lx-section">
        <h2 className="lx-h2" data-reveal>Three simple steps</h2>
        <div className="lx-steps">
          {STEPS.map((s, i) => (
            <div className="lx-step" data-reveal style={{ transitionDelay: `${i * 100}ms` }} key={s.n}>
              <span className="lx-step-n">{s.n}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* final CTA */}
      <section className="lx-final" data-reveal>
        <Logo size={64} />
        <h2>Ready to begin?</h2>
        <p>Start with a short surah every child knows — it only takes a minute.</p>
        <Link to="/watch/surah/1" className="btn btn-gold lx-big"><Play width={18} height={18} /> Watch Surah Al-Fatiha</Link>
      </section>

      <Footer />
    </div>
  );
}
