// analytics.js — GA4 loader + SPA page-view tracking, gated behind consent.
// Quebec's Law 25 treats analytics cookies as non-essential, requiring
// opt-in consent before they're dropped — see components/ConsentBanner.jsx,
// which is the only thing that calls initGA().

const GA_ID = "G-6Y4PDTFKQK";
const CONSENT_KEY = "scx_analytics_consent";

export function getConsent() {
  try {
    return localStorage.getItem(CONSENT_KEY);
  } catch {
    return null;
  }
}

export function setConsent(value) {
  try {
    localStorage.setItem(CONSENT_KEY, value);
  } catch {}
}

let loaded = false;

export function initGA() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag("js", new Date());
  // send_page_view: false — this is a single-page app; page views are sent
  // manually on route change instead (trackPageView, called from App.jsx),
  // since gtag's automatic pageview only fires once on initial script load.
  gtag("config", GA_ID, { send_page_view: false });
}

export function trackPageView(path) {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", "page_view", { page_path: path });
}
