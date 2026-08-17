import { useEffect, useState } from "react";
import { useI18n } from "../i18n/useI18n";
import { getConsent, setConsent, initGA } from "../scripts/analytics";

const API = "https://api.swingconnexion.com/public";

// Hardcoded fallback in case the fetch fails — banner text should never
// silently disappear, since showing it is what makes GA loading compliant.
const FALLBACK_TEXT = {
  text_fr: "Nous utilisons des cookies d'analyse pour mieux comprendre comment le site est utilisé. Acceptez-vous ?",
  text_en: "We use analytics cookies to better understand how the site is used. Do you accept?",
};

export default function ConsentBanner() {
  const { lang } = useI18n();
  const fr = lang !== "en";
  const [visible, setVisible] = useState(false);
  const [text, setText] = useState(FALLBACK_TEXT);

  // Checked on mount rather than at module scope so this re-evaluates per
  // page load without needing a page refresh after the user's first visit.
  useEffect(() => {
    setVisible(getConsent() == null);
  }, []);

  // Editable from Dome → Templates rather than hardcoded here, so non-devs
  // can adjust the wording without a deploy.
  useEffect(() => {
    fetch(`${API}/cookie-consent-text`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.text_fr && data?.text_en) setText(data);
      })
      .catch(() => {});
  }, []);

  if (!visible) return null;

  function accept() {
    setConsent("accepted");
    initGA();
    setVisible(false);
  }

  function decline() {
    setConsent("declined");
    setVisible(false);
  }

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 bg-scx-ink text-white px-4 py-4 md:py-3 flex flex-col md:flex-row items-center gap-3 md:gap-6 shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
      <p className="text-sm text-white/80 text-center md:text-left flex-1">
        {fr ? text.text_fr : text.text_en}
      </p>
      <div className="flex gap-2 shrink-0">
        <button
          type="button"
          onClick={decline}
          className="px-4 py-2 rounded-full text-sm font-semibold border border-white/30 text-white/80 hover:bg-white/10 transition-colors"
        >
          {fr ? "Refuser" : "Decline"}
        </button>
        <button
          type="button"
          onClick={accept}
          className="px-4 py-2 rounded-full text-sm font-semibold bg-[var(--color-scx-primary)] text-white hover:opacity-90 transition-colors"
        >
          {fr ? "Accepter" : "Accept"}
        </button>
      </div>
    </div>
  );
}
