import { Link } from "react-router-dom";

// Shared site footer — used on the landing page and inside the app shell so
// every page carries the same credits + "made by" line.
export default function Footer() {
  return (
    <footer className="lx-footer">
      <span className="lx-madeby">
        Noorly · Made with
        <svg className="lx-heart" width="18" height="18" viewBox="0 0 24 24" aria-label="love" role="img">
          <defs>
            <linearGradient id="lx-heart-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ff5b6b" />
              <stop offset="1" stopColor="#e01020" />
            </linearGradient>
          </defs>
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="url(#lx-heart-grad)" />
        </svg>
        and care for young hearts by <a href="https://mudasirqadir.netlify.app/" target="_blank" rel="noreferrer noopener">Mudasir Qadir</a>
      </span>
      <span className="lx-credits"><Link to="/about">Credits &amp; sources</Link></span>
    </footer>
  );
}
