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
    if (count < 2) return undefined;
    const id = setInterval(next, ROTATE_MS);
    return () => clearInterval(id);
  }, [count, next, index]);

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
      className="select-none mt-6 max-w-[280px] sm:max-w-[320px] md:max-w-[360px]"
    />
  );

  return (
    <div {...swipeHandlers} className="flex flex-col items-center">
      {s.cta_url ? (
        isExternalLink ? (
          <a href={s.cta_url} target="_blank" rel="noopener noreferrer">{imageEl}</a>
        ) : (
          <Link to={s.cta_url}>{imageEl}</Link>
        )
      ) : (
        imageEl
      )}

      {(title || desc) && (
        <div className="mt-3 max-w-xl text-center px-4">
          {title && <p className="font-bold text-white text-lg">{title}</p>}
          {desc && <p className="text-white/70 text-sm mt-1">{desc}</p>}
        </div>
      )}

      {count > 1 && (
        <div className="flex items-center gap-4 mt-3">
          <button onClick={prev} aria-label="Previous" className="text-white/60 hover:text-white text-2xl px-2 leading-none">‹</button>
          <div className="flex gap-1.5">
            {splashes.map((sp, i) => (
              <button
                key={sp.idsplashes}
                onClick={() => setIndex(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`w-2 h-2 rounded-full transition-colors ${i === index ? "bg-white" : "bg-white/30"}`}
              />
            ))}
          </div>
          <button onClick={next} aria-label="Next" className="text-white/60 hover:text-white text-2xl px-2 leading-none">›</button>
        </div>
      )}
    </div>
  );
}
