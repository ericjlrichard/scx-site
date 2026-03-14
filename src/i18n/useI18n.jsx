// src/i18n/useI18n.jsx
import { useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import en from "./en.json";
import fr from "./fr.json";

const dicts = { en, fr };

function get(obj, path) {
  return path
    .split(".")
    .reduce((o, k) => (o && o[k] != null ? o[k] : null), obj);
}

export function useI18n() {
  // If the route doesn't have :lang yet, this will be undefined; default to 'fr' or 'en'
  const { lang: paramLang } = useParams();
  const code = paramLang === "fr" ? "fr" : paramLang === "en" ? "en" : "fr";
  const dict = dicts[code] ?? en;

  // keep <html lang="..."> updated and remember choice
  useEffect(() => {
    document.documentElement.lang = code;
    try {
      localStorage.setItem("lang", code);
    } catch {}
  }, [code]);

  return {
    lang: code,
    t: (key, fallback = key) => get(dict, key) ?? fallback,
  };
}

// Button that swaps /fr/... <-> /en/... without any effects
export function LangToggle({ className = "" }) {
  const { lang: paramLang } = useParams();
  const lang = paramLang === "fr" ? "fr" : "en";
  const other = lang === "fr" ? "en" : "fr";
  const nav = useNavigate();
  const loc = useLocation();

  // replace the first segment if it’s /fr or /en; otherwise just prefix
  const newPath = loc.pathname.match(/^\/(fr|en)(\/|$)/)
    ? loc.pathname.replace(/^\/(fr|en)/, `/${other}`)
    : `/${other}${loc.pathname}`;

  return (
    <button
      type="button"
      onClick={() =>
        nav({ pathname: newPath, search: loc.search, hash: loc.hash })
      }
      className={className}
      aria-label={`Switch to ${other.toUpperCase()}`}
    >
      {other.toUpperCase()}
    </button>
  );
}
