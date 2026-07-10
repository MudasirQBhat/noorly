// All visuals are code-generated SVG/CSS — no photos, no figures, no icon packs.

// Repeating 8-point Islamic star tile, used as a soft background texture.
export function StarTile({ className = "", color = "currentColor", opacity = 0.5 }) {
  return (
    <svg
      className={className}
      width="120"
      height="120"
      viewBox="0 0 120 120"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <pattern id="noor-stars" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
          <g fill="none" stroke={color} strokeWidth="1.1" opacity={opacity}>
            {/* 8-point star (khatam) built from two overlaid squares */}
            <path d="M30 8 L38 22 L52 30 L38 38 L30 52 L22 38 L8 30 L22 22 Z" />
            <rect x="18" y="18" width="24" height="24" transform="rotate(45 30 30)" />
            <circle cx="30" cy="30" r="3" />
          </g>
        </pattern>
      </defs>
      <rect width="120" height="120" fill="url(#noor-stars)" />
    </svg>
  );
}

// A slim arabesque divider — mirrored vines meeting a central star.
export function ArabesqueDivider({ className = "" }) {
  return (
    <svg
      className={`divider ${className}`}
      viewBox="0 0 320 24"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      focusable="false"
    >
      <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <path d="M10 12 H120" opacity="0.35" />
        <path d="M120 12 c14 0 14 -8 26 -8 s12 8 24 8" />
        <path d="M200 12 c-14 0 -14 -8 -26 -8 s-12 8 -24 8" />
        <path d="M200 12 H310" opacity="0.35" />
      </g>
      <g transform="translate(160 12)">
        <path
          d="M0 -9 L2.6 -2.6 L9 0 L2.6 2.6 L0 9 L-2.6 2.6 L-9 0 L-2.6 -2.6 Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

// Fixed decorative backdrop: crescent moon + soft washes + scattered stars.
export function StarField() {
  const stars = [
    [8, 18, 2], [16, 40, 1.4], [24, 12, 1.6], [34, 60, 1.2], [44, 26, 2.2],
    [58, 48, 1.4], [67, 16, 1.8], [76, 55, 1.3], [85, 30, 2], [92, 62, 1.5],
    [12, 72, 1.6], [50, 78, 1.3], [70, 82, 1.7], [30, 88, 1.4], [88, 84, 1.5],
  ];
  return (
    <div className="starfield" aria-hidden="true">
      <div className="wash wash-a" />
      <div className="wash wash-b" />
      <svg className="starfield-svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
        <g className="crescent" transform="translate(84 16)">
          <circle cx="0" cy="0" r="7" fill="var(--gold)" opacity="0.9" />
          <circle cx="2.6" cy="-1.2" r="6.2" fill="var(--parchment)" />
        </g>
        {stars.map(([cx, cy, r], i) => (
          <circle key={i} className="twinkle" cx={cx} cy={cy} r={r} fill="var(--gold)"
            style={{ animationDelay: `${(i % 6) * 0.7}s` }} />
        ))}
      </svg>
    </div>
  );
}

// Abstract, non-figurative glyph per category — geometry & nature motifs only.
export function CategoryGlyph({ name, size = 40 }) {
  const key = (name || "").toLowerCase();
  const stroke = "currentColor";
  const common = {
    width: size, height: size, viewBox: "0 0 48 48",
    fill: "none", stroke, strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round",
    "aria-hidden": true, focusable: "false",
  };
  let paths;
  if (/morning|evening/.test(key))
    paths = <><circle cx="24" cy="26" r="8" /><path d="M24 6v4M24 42v-2M42 26h-4M10 26H6M36 14l-3 3M15 35l-3 3M36 38l-3-3M15 17l-3-3" /></>;
  else if (/sleep|waking/.test(key))
    paths = <path d="M30 10a13 13 0 1 0 8 22 16 16 0 0 1-8-22Z" />;
  else if (/wudu|clean/.test(key))
    paths = <><path d="M24 8c6 8 10 13 10 19a10 10 0 0 1-20 0c0-6 4-11 10-19Z" /><path d="M20 30a4 4 0 0 0 4 4" /></>;
  else if (/prayer|mosque/.test(key))
    paths = <><path d="M10 40V24c0-6 6-12 14-12s14 6 14 12v16" /><path d="M10 40h28M24 12V7M22 9h4" /></>;
  else if (/home|family/.test(key))
    paths = <><path d="M8 24 24 10l16 14" /><path d="M12 22v18h24V22" /><path d="M21 40v-8h6v8" /></>;
  else if (/food|drink/.test(key))
    paths = <><path d="M14 12v24a4 4 0 0 0 8 0V12M18 12v10" /><path d="M32 12c-4 0-6 4-6 9s2 7 6 7v8" /></>;
  else if (/travel/.test(key))
    paths = <><circle cx="24" cy="24" r="15" /><path d="M24 9l4 15-4 15-4-15Z" /></>;
  else if (/weather|nature/.test(key))
    paths = <><path d="M16 30a7 7 0 0 1 1-14 9 9 0 0 1 17 2 6 6 0 0 1-1 12H17Z" /><path d="M18 36l-2 4M26 36l-2 4M34 36l-2 4" /></>;
  else if (/worry|relief/.test(key))
    paths = <><path d="M24 40s-13-8-13-18a8 8 0 0 1 13-6 8 8 0 0 1 13 6c0 4-2 8-5 11" /><path d="M28 30l4 4 6-8" /></>;
  else if (/sick|hardship/.test(key))
    paths = <><circle cx="24" cy="24" r="15" /><path d="M24 16v16M16 24h16" /></>;
  else if (/manners|people/.test(key))
    paths = <><path d="M24 12l3.5 7 7.5 1-5.5 5.5 1.5 7.5L24 36l-6.5 4 1.5-7.5L13.5 27l7.5-1Z" /></>;
  else if (/forgive|protection/.test(key))
    paths = <><path d="M24 6l14 5v9c0 9-6 15-14 18-8-3-14-9-14-18v-9Z" /><path d="M18 24l4 4 8-9" /></>;
  else
    paths = <><path d="M24 6 27 21 42 24 27 27 24 42 21 27 6 24 21 21Z" /><circle cx="24" cy="24" r="3" /></>;
  return <svg {...common}>{paths}</svg>;
}
