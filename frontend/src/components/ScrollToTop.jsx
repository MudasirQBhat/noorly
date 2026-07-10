import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

// Reset scroll to the top on every route change. React Router keeps the previous
// scroll position by default, which makes a new page open already scrolled down.
export default function ScrollToTop() {
  const { pathname } = useLocation();
  useLayoutEffect(() => {
    // jump (not smooth-scroll) to the top — the page uses scroll-behavior:smooth,
    // so we force "instant" to avoid an animated scroll on every navigation.
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    document.querySelector(".content")?.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);
  return null;
}
