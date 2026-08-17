// src/App.jsx
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Header from "./components/Header";
import ConsentBanner from "./components/ConsentBanner";
import { getConsent, initGA, trackPageView } from "./scripts/analytics";
import { Outlet } from "react-router-dom";

export default function App() {
  const location = useLocation();

  // Returning visitor who already consented on a prior visit — start GA
  // right away rather than waiting for them to click Accept again.
  useEffect(() => {
    if (getConsent() === "accepted") initGA();
  }, []);

  // GA's automatic pageview only fires once, on initial script load — this
  // is a single-page app, so route changes need to be sent manually.
  useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location.pathname, location.search]);

  return (
    <main className="min-h-dvh bg-scx-paper text-scx-ink font-sans">
      <Header />
      <Outlet />
      <ConsentBanner />
    </main>
  );
}
