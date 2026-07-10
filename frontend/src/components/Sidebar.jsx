import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, useParams, useLocation } from "react-router-dom";
import { getDuas, getSurahs } from "../lib/api.js";
import { CategoryGlyph } from "./Pattern.jsx";

function Chevron({ open }) {
  return (
    <svg className={`chev ${open ? "open" : ""}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

export default function Sidebar({ onNavigate }) {
  const [duas, setDuas] = useState([]);
  const [surahs, setSurahs] = useState([]);
  const [query, setQuery] = useState("");
  const params = useParams();
  const loc = useLocation();
  const navRef = useRef(null);

  const onDuaPage = loc.pathname.startsWith("/watch/dua");
  const onSurahPage = loc.pathname.startsWith("/watch/surah");

  // collapsed by default — only auto-open the section for the page you're on
  const [openDuas, setOpenDuas] = useState(onDuaPage);
  const [openSurahs, setOpenSurahs] = useState(onSurahPage);
  const [openCats, setOpenCats] = useState(() => new Set());

  useEffect(() => {
    getDuas().then(setDuas);
    getSurahs().then(setSurahs);
  }, []);

  const q = query.trim().toLowerCase();
  const searching = q.length > 0;

  const byCat = useMemo(() => {
    const m = new Map();
    duas.forEach((d) => { if (!m.has(d.category)) m.set(d.category, []); m.get(d.category).push(d); });
    // apply search filter
    let entries = [...m.entries()];
    if (searching) {
      entries = entries
        .map(([cat, list]) => {
          const catMatch = cat.toLowerCase().includes(q);
          const filtered = catMatch ? list : list.filter((d) => d.titleEn.toLowerCase().includes(q));
          return [cat, filtered];
        })
        .filter(([, list]) => list.length > 0);
    }
    return entries;
  }, [duas, q, searching]);

  const shownSurahs = useMemo(() => {
    if (!searching) return surahs;
    return surahs.filter((s) =>
      s.nameEn.toLowerCase().includes(q) ||
      (s.nameTranslation || "").toLowerCase().includes(q) ||
      (s.nameArabic || "").includes(query.trim()) ||
      String(s.number).includes(q)
    );
  }, [surahs, q, searching, query]);

  // auto-open the category holding the active dua / the surahs section for a surah
  const activeDuaId = onDuaPage ? params.id : null;
  useEffect(() => {
    if (!activeDuaId || !duas.length) return;
    const d = duas.find((x) => x.id === activeDuaId);
    if (d) { setOpenDuas(true); setOpenCats((s) => new Set(s).add(d.category)); }
  }, [activeDuaId, duas]);
  useEffect(() => { if (onSurahPage) setOpenSurahs(true); }, [onSurahPage, params.number]);

  // Scroll the active item into view ONLY when navigation changes — never on a
  // manual expand/collapse. Toggling a section must keep the sidebar's scroll
  // position steady, so openDuas/openSurahs/openCats are intentionally excluded.
  useEffect(() => {
    const t = setTimeout(() => {
      navRef.current?.querySelector(".side-item.active")?.scrollIntoView({ block: "nearest" });
    }, 60);
    return () => clearTimeout(t);
  }, [loc.pathname]);

  const toggleCat = (c) => setOpenCats((s) => { const n = new Set(s); n.has(c) ? n.delete(c) : n.add(c); return n; });

  const duasOpen = searching ? byCat.length > 0 : openDuas;
  const surahsOpen = searching ? shownSurahs.length > 0 : openSurahs;
  const catOpen = (cat) => (searching ? true : openCats.has(cat));

  return (
    <nav className="sidebar" aria-label="Duas and Surahs" ref={navRef}>
      {/* search */}
      <div className="side-search">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
        <input type="search" placeholder="Search duas & surahs…" value={query}
          onChange={(e) => setQuery(e.target.value)} aria-label="Search duas and surahs" />
        {query && <button className="side-search-clear" onClick={() => setQuery("")} aria-label="Clear search">✕</button>}
      </div>

      {searching && byCat.length === 0 && shownSurahs.length === 0 && (
        <p className="side-empty">No matches for “{query}”.</p>
      )}

      {/* DUAS */}
      {(!searching || byCat.length > 0) && (
        <button className="side-section" onClick={() => setOpenDuas((v) => !v)} aria-expanded={duasOpen}>
          <Chevron open={duasOpen} />
          <span className="side-section-ic" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l2.4 5.2L20 8l-4 3.9L17 18l-5-3-5 3 1-6.1L4 8l5.6-.8z" /></svg>
          </span>
          <span className="side-section-label">Duas</span>
          <span className="side-count">{searching ? byCat.reduce((n, [, l]) => n + l.length, 0) : duas.length}</span>
        </button>
      )}

      {duasOpen && (
        <div className="side-group">
          {byCat.map(([cat, list]) => {
            const open = catOpen(cat);
            return (
              <div key={cat} className="side-cat">
                <button className="side-cat-head" onClick={() => toggleCat(cat)} aria-expanded={open}>
                  <Chevron open={open} />
                  <span className="side-cat-glyph"><CategoryGlyph name={cat} size={18} /></span>
                  <span className="side-cat-label">{cat}</span>
                  <span className="side-count">{list.length}</span>
                </button>
                {open && (
                  <ul className="side-items">
                    {list.map((d) => (
                      <li key={d.id}>
                        <NavLink to={`/watch/dua/${d.id}`} onClick={onNavigate}
                          className={({ isActive }) => `side-item ${isActive ? "active" : ""}`}>
                          <span className="side-dot" />{d.titleEn}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* SURAHS */}
      {(!searching || shownSurahs.length > 0) && (
        <button className="side-section" onClick={() => setOpenSurahs((v) => !v)} aria-expanded={surahsOpen}>
          <Chevron open={surahsOpen} />
          <span className="side-section-ic" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2z" /><path d="M18 3v18" /></svg>
          </span>
          <span className="side-section-label">Al-Fatiha &amp; Juz 30</span>
          <span className="side-count">{searching ? shownSurahs.length : surahs.length}</span>
        </button>
      )}

      {surahsOpen && (
        <ul className="side-items side-surahs">
          {shownSurahs.map((s) => (
            <li key={s.number}>
              <NavLink to={`/watch/surah/${s.number}`} onClick={onNavigate}
                className={({ isActive }) => `side-item ${isActive ? "active" : ""}`}>
                <span className="side-num">{s.number}</span>
                <span className="side-surah-name">{s.nameEn}</span>
                <span className="side-surah-ar" lang="ar">{s.nameArabic}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      )}

      <div className="side-foot">
        <NavLink to="/about" onClick={onNavigate} className="side-item">Credits &amp; Sources</NavLink>
      </div>
    </nav>
  );
}
