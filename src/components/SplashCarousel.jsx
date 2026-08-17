// SplashCarousel.jsx — rotating homepage promo splash(es), admin-managed via Dome.
//
// Fetches active splashes from the public API. Renders nothing if none are
// active, a static image if exactly one, or an auto-rotating (7s) carousel
// with swipe/click navigation if more than one.

import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSwipe } from "../hooks/useSwipe";

const ROTATE_MS = 7000;

export default function SplashCarousel({ lang }) {
  const [splashes, setSplashes] = useState([]);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    fetch("https://api.swingconnexion.com/public/splashes")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setSplashes(data); })
      .catch(() => {});
  }, []);

  const count = splashes.length;

  const next = useCallback(() => setIndex((i) => (i + 1) % Math.max(count, 1)), [count]);
  const prev = useCallback(() => setIndex((i) => (i - 1 + Math.max(count, 1)) % Math.max(count, 1)), [count]);
  const swipeHandlers = useSwipe(next, prev);

  useEffect(() => {
    // Paused while the visitor is reading one (hover, focus, or a touch in
    // progress) — otherwise it can rotate away mid-read on a slow connection
    // or a slide with more text.
    if (count < 2 || paused) return undefined;
    const id = setInterval(next, ROTATE_MS);
    return () => clearInterval(id);
  }, [count, next, index, paused]);

  if (count === 0) return null;

  const s = splashes[Math.min(index, count - 1)];
  const title = (lang === "en" ? s.title_en : s.title_fr) || "";
  const image = (lang === "en" ? s.image_url_en : s.image_url_fr) || "";
  const desc = (lang === "en" ? s.description_en : s.description_fr) || "";
  const isExternalLink = s.cta_url && /^https?:\/\//i.test(s.cta_url);

  const imageEl = (
    <img
      key={s.idsplashes}
      src={image}
      alt={title}
      className="select-none max-w-[300px] sm:max-w-[340px] md:max-w-[400px] lg:max-w-[440px] xl:max-w-[500px]"
    />
  );

  const arrowClass =
    "absolute top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-9 h-9 rounded-full bg-black/30 hover:bg-black/50 text-white text-2xl leading-none transition-colors";

  return (
    <div
      onTouchStart={(e) => { setPaused(true); swipeHandlers.onTouchStart(e); }}
      onTouchEnd={(e) => { setPaused(false); swipeHandlers.onTouchEnd(e); }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="flex flex-col items-center"
    >
      <div className="relative inline-flex items-center justify-center mt-6">
        {count > 1 && (
          <button onClick={prev} aria-label="Previous" className={`${arrowClass} left-2`}>‹</button>
        )}
        {s.cta_url ? (
          isExternalLink ? (
            <a href={s.cta_url} target="_blank" rel="noopener noreferrer">{imageEl}</a>
          ) : (
            <Link to={s.cta_url}>{imageEl}</Link>
          )
        ) : (
          imageEl
        )}
        {count > 1 && (
          <button onClick={next} aria-label="Next" className={`${arrowClass} right-2`}>›</button>
        )}
      </div>

      {(title || desc) && (
        <div className="mt-3 max-w-xl text-center px-4">
          {title && <p className="font-bold text-white text-lg">{title}</p>}
          {desc && <p className="text-white/70 text-sm mt-1">{desc}</p>}
        </div>
      )}

      {count > 1 && (
        <div className="flex gap-1.5 mt-3">
          {splashes.map((sp, i) => (
            <button
              key={sp.idsplashes}
              onClick={() => setIndex(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`w-2 h-2 rounded-full transition-colors ${i === index ? "bg-white" : "bg-white/30"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
