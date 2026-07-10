// Full-bleed, code-generated animated scenes for Cinema Mode.
// STRICT: no people, no animals, no photos — only geometry, architecture,
// objects and nature. Each scene is a self-contained SVG + CSS animation.

// ---- scene selection ----
export function sceneForDua(category = "") {
  const k = category.toLowerCase();
  if (/morning|evening/.test(k)) return "dawn";
  if (/sleep|waking/.test(k)) return "night";
  if (/wudu|clean/.test(k)) return "water";
  if (/prayer|mosque/.test(k)) return "mosque";
  if (/home|family/.test(k)) return "home";
  if (/food|drink/.test(k)) return "table";
  if (/travel/.test(k)) return "journey";
  if (/weather|nature/.test(k)) return "rain";
  if (/worry|relief|sick|hardship/.test(k)) return "calm";
  if (/forgive|protection/.test(k)) return "cosmos";
  if (/manners|people|routine/.test(k)) return "day";
  return "cosmos";
}

const NATURE = ["mountains", "ocean", "desert", "valley", "night", "dawn"];
export function sceneForSurah(surah) {
  // deterministic variety across the 37 surahs
  return NATURE[(surah?.number ?? 0) % NATURE.length];
}

// ---- shared sky gradient defs ----
function Sky({ from, to, id }) {
  return (
    <defs>
      <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={from} />
        <stop offset="100%" stopColor={to} />
      </linearGradient>
    </defs>
  );
}

function Stars({ n = 40, bright = "#fff" }) {
  const pts = [];
  let seed = 7;
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  for (let i = 0; i < n; i++) pts.push([rnd() * 100, rnd() * 55, 0.4 + rnd() * 1.3, (i % 6) * 0.6]);
  return (
    <g>
      {pts.map(([x, y, r, d], i) => (
        <circle key={i} className="c-twinkle" cx={x} cy={y} r={r} fill={bright} style={{ animationDelay: `${d}s` }} />
      ))}
    </g>
  );
}

// Floating cartoon sparkles that drift upward — adds life to every scene.
function Sparkles({ n = 12, color = "#fff" }) {
  const pts = [];
  let seed = 19;
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  for (let i = 0; i < n; i++) pts.push([6 + rnd() * 88, 20 + rnd() * 74, 0.5 + rnd() * 1.4, rnd() * 6, 6 + rnd() * 7]);
  return (
    <g className="scene-sparkles">
      {pts.map(([x, y, r, d, dur], i) => (
        <g key={i} className="spark" style={{ animationDelay: `${d}s`, animationDuration: `${dur}s`, transformOrigin: `${x}px ${y}px` }}>
          <path d={`M${x} ${y - r} L${x + r * 0.35} ${y - r * 0.35} L${x + r} ${y} L${x + r * 0.35} ${y + r * 0.35} L${x} ${y + r} L${x - r * 0.35} ${y + r * 0.35} L${x - r} ${y} L${x - r * 0.35} ${y - r * 0.35} Z`} fill={color} />
        </g>
      ))}
    </g>
  );
}

const SPARKLE_COLOR = {
  night: "#ffe9bf", cosmos: "#ffe9bf", mosque: "#ffe9bf",
  ocean: "#eafaff", water: "#eafaff", rain: "#eafaff",
};

export default function Scene({ type = "cosmos" }) {
  return (
    <div className={`scene scene-${type}`} aria-hidden="true">
      <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" className="scene-svg">
        {renderScene(type)}
        <Sparkles color={SPARKLE_COLOR[type] || "#fff6df"} />
      </svg>
      <div className="scene-veil" />
    </div>
  );
}

function renderScene(type) {
  switch (type) {
    case "dawn":
      return (<>
        <Sky id="g-dawn" from="#fbe4c2" to="#f6b06a" />
        <rect width="100" height="100" fill="url(#g-dawn)" />
        <g className="c-rays" transform="translate(50 70)" stroke="#ffe9bf" strokeWidth="0.6" opacity="0.6">
          {Array.from({ length: 12 }).map((_, i) => (
            <line key={i} x1="0" y1="0" x2="0" y2="-42" transform={`rotate(${i * 30})`} />
          ))}
        </g>
        <circle className="c-rise" cx="50" cy="70" r="14" fill="#ffdf9e" opacity="0.95" />
        <g className="c-drift" fill="#fff" opacity="0.75"><ellipse cx="22" cy="30" rx="11" ry="4" /><ellipse cx="30" cy="28" rx="7" ry="3.2" /></g>
        <g className="c-drift2" fill="#fff" opacity="0.6"><ellipse cx="74" cy="24" rx="9" ry="3.4" /></g>
        <path d="M0 78 Q25 68 50 76 T100 74 V100 H0 Z" fill="#e79b57" opacity="0.55" />
        <path d="M0 86 Q30 78 60 84 T100 82 V100 H0 Z" fill="#c9743a" opacity="0.6" />
        {/* bed (object, not a figure) */}
        <g transform="translate(60 84)" fill="#7a4a26" opacity="0.85">
          <rect x="0" y="4" width="30" height="7" rx="1.5" />
          <rect x="0" y="0" width="9" height="6" rx="1.5" fill="#f7e7c6" />
          <rect x="-1" y="9" width="3" height="6" /><rect x="28" y="9" width="3" height="6" />
        </g>
      </>);
    case "night":
      return (<>
        <Sky id="g-night" from="#0b2447" to="#123a5e" />
        <rect width="100" height="100" fill="url(#g-night)" />
        <Stars n={50} bright="#ffe9bf" />
        {/* shooting star */}
        <g className="c-shoot"><line x1="0" y1="0" x2="9" y2="3" stroke="#fff7de" strokeWidth="0.7" strokeLinecap="round" /><circle cx="9" cy="3" r="1" fill="#fff" /></g>
        <g className="c-float" transform="translate(78 20)">
          <circle cx="0" cy="0" r="8" fill="#f4e3b0" />
          <circle cx="3" cy="-2" r="6.8" fill="#123a5e" />
        </g>
        <path d="M0 82 Q30 74 60 80 T100 78 V100 H0 Z" fill="#0e2e4d" />
        <g transform="translate(58 86)">
          <rect x="0" y="4" width="32" height="7" rx="1.5" fill="#1c4a72" />
          <rect x="0" y="0" width="10" height="6" rx="1.5" fill="#cfe0ef" />
          <rect x="-1" y="9" width="3" height="6" fill="#143654" /><rect x="30" y="9" width="3" height="6" fill="#143654" />
        </g>
      </>);
    case "water":
      return (<>
        <Sky id="g-water" from="#dff4ef" to="#8fd0c4" />
        <rect width="100" height="100" fill="url(#g-water)" />
        <g className="c-wave" stroke="#2b7e78" fill="none" strokeWidth="1.1" opacity="0.5">
          <path d="M-10 60 Q10 55 30 60 T70 60 T110 60" />
          <path d="M-10 70 Q10 65 30 70 T70 70 T110 70" />
          <path d="M-10 80 Q10 75 30 80 T70 80 T110 80" />
        </g>
        <g className="c-drop" fill="#2b7e78" opacity="0.7">
          <path d="M50 8 C46 16 44 20 44 24 a6 6 0 0 0 12 0 c0-4-2-8-6-16Z" />
        </g>
      </>);
    case "mosque":
      return (<>
        <Sky id="g-mosque" from="#123a5e" to="#2b6f7e" />
        <rect width="100" height="100" fill="url(#g-mosque)" />
        <Stars n={30} bright="#ffe9bf" />
        <g fill="#0e2c3f" opacity="0.92">
          <path d="M0 70 h100 v30 H0 Z" />
          <path d="M20 70 v-16 a6 6 0 0 1 12 0 v16 Z" />
          <path d="M68 70 v-16 a6 6 0 0 1 12 0 v16 Z" />
          {/* central dome + minaret */}
          <path d="M40 70 v-14 a10 10 0 0 1 20 0 v14 Z" />
          <path d="M50 40 l2 6 h-4 Z" />
          <rect x="86" y="40" width="4" height="30" /><path d="M85 40 l3 -6 l3 6 Z" />
        </g>
        {/* hanging lantern */}
        <g className="c-sway" transform="translate(50 20)">
          <line x1="0" y1="-20" x2="0" y2="0" stroke="#d8a53a" strokeWidth="0.4" />
          <path d="M-3 0 h6 l-1.5 7 h-3 Z" fill="#f0c66a" />
          <circle cx="0" cy="3.5" r="1.2" fill="#fff4d0" />
        </g>
      </>);
    case "home":
      return (<>
        <Sky id="g-home" from="#f3c98b" to="#b56a52" />
        <rect width="100" height="100" fill="url(#g-home)" />
        <circle cx="20" cy="26" r="9" fill="#ffe6a8" opacity="0.85" />
        <g fill="#5a3324" opacity="0.92">
          <path d="M40 78 v-20 l14 -12 l14 12 v20 Z" />
          <path d="M52 40 l16 14 h-4 l-12 -10 l-12 10 h-4 Z" />
          <rect x="30" y="70" width="60" height="30" opacity="0.5" />
        </g>
        <rect x="50" y="60" width="8" height="8" rx="1" fill="#ffdf9e" className="c-glow" />
        <rect x="45" y="82" width="6" height="14" fill="#3d2015" />
      </>);
    case "table":
      return (<>
        <Sky id="g-table" from="#fbe7cf" to="#efc98f" />
        <rect width="100" height="100" fill="url(#g-table)" />
        <circle cx="50" cy="50" r="34" fill="#fff6e2" opacity="0.5" />
        {/* plate + cup + steam (objects) */}
        <ellipse cx="44" cy="70" rx="22" ry="7" fill="#e6cfa2" />
        <ellipse cx="44" cy="68" rx="16" ry="5" fill="#fff8ea" />
        <g transform="translate(72 60)" fill="#cf9b5e">
          <path d="M0 4 h10 v8 a5 5 0 0 1 -10 0 Z" /><path d="M10 6 a3 3 0 0 1 0 6" fill="none" stroke="#cf9b5e" strokeWidth="1" />
        </g>
        <g className="c-steam" stroke="#c89a5c" strokeWidth="1" fill="none" opacity="0.6">
          <path d="M40 60 q3 -5 0 -10 q-3 -5 0 -10" />
          <path d="M48 60 q3 -5 0 -10 q-3 -5 0 -10" />
        </g>
      </>);
    case "journey":
      return (<>
        <Sky id="g-journey" from="#cfe8f5" to="#f4d9a8" />
        <rect width="100" height="100" fill="url(#g-journey)" />
        <circle cx="72" cy="24" r="8" fill="#ffe08a" opacity="0.9" />
        <g className="c-drift" fill="#ffffff" opacity="0.7">
          <ellipse cx="25" cy="22" rx="10" ry="4" /><ellipse cx="33" cy="20" rx="7" ry="3.5" />
        </g>
        <path d="M0 64 L30 44 L48 62 L70 40 L100 66 V100 H0 Z" fill="#8fae9b" opacity="0.9" />
        <path d="M0 74 L26 58 L52 76 L78 56 L100 78 V100 H0 Z" fill="#5e7d6b" />
        <path d="M46 100 L54 74 Q58 70 52 66 L50 66 Q44 70 48 74 Z" fill="#e9d6a8" />
        <g stroke="#cbb684" strokeWidth="0.5" strokeDasharray="2 2"><line x1="51" y1="74" x2="51" y2="98" /></g>
      </>);
    case "rain":
      return (<>
        <Sky id="g-rain" from="#9fb6c4" to="#c9d6de" />
        <rect width="100" height="100" fill="url(#g-rain)" />
        <g fill="#6b7f8c" opacity="0.9">
          <ellipse cx="40" cy="30" rx="16" ry="8" /><ellipse cx="55" cy="27" rx="12" ry="7" /><ellipse cx="30" cy="33" rx="10" ry="6" />
        </g>
        <g className="c-rain" stroke="#5b7686" strokeWidth="0.7" opacity="0.6">
          {Array.from({ length: 22 }).map((_, i) => (
            <line key={i} x1={8 + i * 4} y1="42" x2={6 + i * 4} y2="52" />
          ))}
        </g>
        <g stroke="#8fa7b4" strokeWidth="0.5" fill="none" opacity="0.5">
          <path d="M30 80 q4 -3 8 0" /><path d="M55 84 q4 -3 8 0" />
        </g>
      </>);
    case "mountains":
      return (<>
        <Sky id="g-mtn" from="#bfe0ef" to="#eef6f2" />
        <rect width="100" height="100" fill="url(#g-mtn)" />
        <circle className="c-float" cx="74" cy="22" r="7" fill="#ffe08a" opacity="0.9" />
        <g className="c-drift" fill="#fff" opacity="0.85"><ellipse cx="24" cy="20" rx="12" ry="4.2" /><ellipse cx="33" cy="18" rx="8" ry="3.4" /></g>
        <g className="c-drift2" fill="#fff" opacity="0.7"><ellipse cx="60" cy="30" rx="9" ry="3.4" /></g>
        <path d="M0 60 L22 34 L40 60 Z" fill="#7fa0b0" />
        <path d="M28 66 L54 28 L82 66 Z" fill="#5c7f92" />
        <path d="M60 64 L82 40 L100 64 Z" fill="#496a7c" />
        <path d="M46 40 L54 28 L60 40 Z" fill="#f5fbff" />
        <path d="M0 66 H100 V100 H0 Z" fill="#3d5a68" />
      </>);
    case "ocean":
      return (<>
        <Sky id="g-oc" from="#bfe6f2" to="#7fc3d8" />
        <rect width="100" height="100" fill="url(#g-oc)" />
        <circle className="c-float" cx="26" cy="24" r="7" fill="#fff0c2" opacity="0.9" />
        <g className="c-drift" fill="#fff" opacity="0.8"><ellipse cx="64" cy="20" rx="11" ry="4" /><ellipse cx="72" cy="18" rx="7" ry="3.2" /></g>
        <rect x="0" y="58" width="100" height="42" fill="#2f8ba8" />
        {/* bobbing boat (an object — no figures) */}
        <g className="c-boat" transform="translate(66 52)">
          <path d="M-8 6 h16 l-3 5 h-10 Z" fill="#7a4a26" />
          <path d="M0 6 V-9 L9 4 Z" fill="#fff3da" />
          <rect x="-0.6" y="-9" width="1.2" height="15" fill="#5a3218" />
        </g>
        <g className="c-wave" stroke="#bfe6f2" fill="none" strokeWidth="0.9" opacity="0.5">
          <path d="M-10 68 Q10 64 30 68 T70 68 T110 68" />
          <path d="M-10 78 Q10 74 30 78 T70 78 T110 78" />
          <path d="M-10 88 Q10 84 30 88 T70 88 T110 88" />
        </g>
      </>);
    case "desert":
      return (<>
        <Sky id="g-des" from="#fde3b0" to="#f2b877" />
        <rect width="100" height="100" fill="url(#g-des)" />
        <circle cx="50" cy="30" r="9" fill="#fff1cf" opacity="0.9" />
        <path d="M0 70 Q30 60 55 70 T100 68 V100 H0 Z" fill="#e2a765" />
        <path d="M0 82 Q35 72 70 82 T100 80 V100 H0 Z" fill="#c98643" />
      </>);
    case "valley":
      return (<>
        <Sky id="g-val" from="#cdeaf0" to="#eaf6e6" />
        <rect width="100" height="100" fill="url(#g-val)" />
        <circle cx="72" cy="24" r="7" fill="#ffe08a" opacity="0.85" />
        <path d="M0 58 L30 40 L60 58 Z" fill="#9cc19a" opacity="0.8" />
        <path d="M40 62 L72 42 L100 62 Z" fill="#7bad84" opacity="0.85" />
        <path d="M0 62 Q50 54 100 62 V100 H0 Z" fill="#5f9e6b" />
        <path d="M0 76 Q50 70 100 76 V100 H0 Z" fill="#4a8557" />
      </>);
    case "calm":
      return (<>
        <Sky id="g-calm" from="#e9d9f0" to="#f9dfc9" />
        <rect width="100" height="100" fill="url(#g-calm)" />
        <circle className="c-rise" cx="50" cy="66" r="12" fill="#ffe1c2" opacity="0.9" />
        <g className="c-drift" fill="#ffffff" opacity="0.6">
          <ellipse cx="30" cy="40" rx="12" ry="4" /><ellipse cx="66" cy="34" rx="14" ry="4.5" />
        </g>
        <path d="M0 80 Q50 72 100 80 V100 H0 Z" fill="#d8b79b" opacity="0.6" />
      </>);
    case "day":
      return (<>
        <Sky id="g-day" from="#bfe3f5" to="#eaf6ff" />
        <rect width="100" height="100" fill="url(#g-day)" />
        <circle className="c-rays" cx="76" cy="22" r="9" fill="#ffe08a" opacity="0.9" />
        <g className="c-drift" fill="#ffffff" opacity="0.85">
          <ellipse cx="30" cy="30" rx="12" ry="4.5" /><ellipse cx="40" cy="28" rx="8" ry="3.5" />
        </g>
        <path d="M0 82 Q50 76 100 82 V100 H0 Z" fill="#bcd9c2" />
      </>);
    case "cosmos":
    default:
      return (<>
        <Sky id="g-cos" from="#141e3c" to="#2a2350" />
        <rect width="100" height="100" fill="url(#g-cos)" />
        <circle cx="30" cy="35" r="26" fill="#3a2f66" opacity="0.5" />
        <circle cx="70" cy="60" r="30" fill="#2b3f6b" opacity="0.4" />
        <Stars n={70} bright="#ffe9bf" />
        <g className="c-shoot"><line x1="0" y1="0" x2="10" y2="3" stroke="#fff7de" strokeWidth="0.7" strokeLinecap="round" /><circle cx="10" cy="3" r="1" fill="#fff" /></g>
        {/* little ringed planet */}
        <g className="c-float" transform="translate(24 66)">
          <circle cx="0" cy="0" r="4.4" fill="#c98a5e" /><ellipse cx="0" cy="0" rx="8" ry="2.4" fill="none" stroke="#e7c58f" strokeWidth="0.8" transform="rotate(-20)" />
        </g>
        <g className="c-float" transform="translate(80 22)">
          <circle cx="0" cy="0" r="6" fill="#f4e3b0" /><circle cx="2.4" cy="-1.5" r="5" fill="#1a2340" />
        </g>
      </>);
  }
}
