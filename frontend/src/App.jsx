import { Routes, Route, Navigate, useParams } from "react-router-dom";
import AppLayout from "./components/AppLayout.jsx";
import AdminGate from "./components/AdminGate.jsx";
import ScrollToTop from "./components/ScrollToTop.jsx";
import Landing from "./pages/Landing.jsx";
import Watch from "./pages/Watch.jsx";
import About from "./pages/About.jsx";

function LegacyDua() { const { id } = useParams(); return <Navigate to={`/watch/dua/${id}`} replace />; }
function LegacySurah() { const { number } = useParams(); return <Navigate to={`/watch/surah/${number}`} replace />; }

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* standalone landing / home (no sidebar) */}
        <Route path="/" element={<Landing />} />
        {/* app shell with sidebar */}
        <Route element={<AppLayout />}>
          <Route path="/watch/dua/:id" element={<Watch kind="dua" />} />
          <Route path="/watch/surah/:number" element={<Watch kind="surah" />} />
          <Route path="/about" element={<About />} />
          <Route path="/dua/:id" element={<LegacyDua />} />
          <Route path="/surah/:number" element={<LegacySurah />} />
          <Route path="/browse" element={<Navigate to="/" replace />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {/* hidden bottom-left admin trigger, present on every page */}
      <AdminGate />
    </>
  );
}
