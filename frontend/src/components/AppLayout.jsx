import { useState } from "react";
import { Link, Outlet } from "react-router-dom";
import Sidebar from "./Sidebar.jsx";
import Logo from "./Logo.jsx";
import SupportButton from "./SupportButton.jsx";
import Footer from "./Footer.jsx";

export default function AppLayout() {
  const [drawer, setDrawer] = useState(false);

  return (
    <div className="layout">
      <header className="topbar">
        <button className="hamburger" onClick={() => setDrawer((v) => !v)} aria-label="Toggle menu" aria-expanded={drawer}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
        <Link to="/" className="brand" onClick={() => setDrawer(false)}>
          <Logo size={34} />
          <span className="brand-name">Noor<span>ly</span></span>
        </Link>
        <span className="topbar-tag">Learn &amp; memorize duas and Juz 30</span>
        <SupportButton variant="chip" />
      </header>

      <div className="layout-body">
        <aside className={`sidebar-wrap ${drawer ? "open" : ""}`}>
          <Sidebar onNavigate={() => setDrawer(false)} />
        </aside>
        {drawer && <div className="scrim" onClick={() => setDrawer(false)} />}
        <main className="content">
          <Outlet />
        </main>
      </div>

      <Footer />
    </div>
  );
}
