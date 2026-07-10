// Inline UI icons (geometric only — no figures).
const base = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };

export const Play = (p) => (<svg {...base} {...p}><path d="M7 5l12 7-12 7z" fill="currentColor" stroke="none" /></svg>);
export const Pause = (p) => (<svg {...base} {...p}><rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none" /><rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none" /></svg>);
export const Repeat = (p) => (<svg {...base} {...p}><path d="M17 2l4 4-4 4" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><path d="M7 22l-4-4 4-4" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></svg>);
export const Restart = (p) => (<svg {...base} {...p}><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /></svg>);
export const Star = (p) => (<svg {...base} {...p}><path d="M12 3l2.6 5.7L21 9.5l-4.5 4.3L17.8 21 12 17.6 6.2 21l1.3-7.2L3 9.5l6.4-.8z" fill="currentColor" stroke="none" /></svg>);
export const Info = (p) => (<svg {...base} {...p}><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></svg>);
export const Book = (p) => (<svg {...base} {...p}><path d="M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2z" /><path d="M18 3v18" /></svg>);
