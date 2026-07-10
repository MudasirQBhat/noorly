import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getSurahs, getDuas } from "../lib/api.js";
import { ArabesqueDivider } from "../components/Pattern.jsx";

export default function Welcome() {
  const [surahs, setSurahs] = useState([]);
  const [duas, setDuas] = useState([]);
  useEffect(() => { getSurahs().then(setSurahs); getDuas().then(setDuas); }, []);

  const picks = surahs.filter((s) => s.numberOfAyahs <= 5).slice(0, 4);
  const duaPicks = duas.filter((d) => d.audioScope === "dua").slice(0, 4);

  return (
    <div className="welcome">
      <section className="welcome-hero">
        <p className="hero-arabic" lang="ar">ٱقْرَأْ بِٱسْمِ رَبِّكَ</p>
        <h1>Watch, listen &amp; <span className="accent">memorize</span></h1>
        <p>
          Pick any <b>dua</b> or <b>surah</b> from the menu — it plays like a little video:
          a calm scene, the recitation, and the words highlighting along with subtitles.
          Perfect for young readers and for older kids learning to memorize.
        </p>
      </section>

      <ArabesqueDivider />

      {picks.length > 0 && (
        <section className="welcome-row">
          <h2>Start with a short surah</h2>
          <div className="welcome-tiles">
            {picks.map((s) => (
              <Link key={s.number} to={`/watch/surah/${s.number}`} className="welcome-tile">
                <span className="welcome-tile-num">{s.number}</span>
                <span className="welcome-tile-name">{s.nameEn}</span>
                <span className="welcome-tile-sub">{s.nameTranslation}</span>
                <span className="welcome-tile-play">▶ Watch</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {duaPicks.length > 0 && (
        <section className="welcome-row">
          <h2>Everyday duas to learn</h2>
          <div className="welcome-tiles">
            {duaPicks.map((d) => (
              <Link key={d.id} to={`/watch/dua/${d.id}`} className="welcome-tile">
                <span className="welcome-tile-name">{d.titleEn}</span>
                <span className="welcome-tile-sub">{d.category}</span>
                <span className="welcome-tile-play">▶ Watch</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
