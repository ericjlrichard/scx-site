// SplashCarousel.jsx — rotating homepage promo splash(es), admin-managed via Dome.
//
// Fetches active splashes from the public API. Renders nothing if none are
// active, a static image if exactly one, or an auto-rotating (7s) carousel
// with swipe/click navigation if more than one.

import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useSwipe } from "../hooks/useSwipe";

const ROTATE_MS = 7000;

// Same responsive width the image box has always used — pulled out so both
// the box (for measuring) and the box (for its own max-width) share one
// source of truth instead of drifting apart.
const BOX_WIDTH_CLASS = "max-w-[300px] sm:max-w-[340px] md:max-w-[400px] lg:max-w-[440px] xl:max-w-[500px]";

export default function SplashCarousel({ lang }) {
  const [splashes, setSplashes] = useState([]);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [boxHeight, setBoxHeight] = useState(null);
  const [captionHeight, setCaptionHeight] = useState(null);
  const wrapRef = useRef(null);
  const captionRef = useRef(null);

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

  // Preload every image in the active language (so swapping the visible
  // <img> paints instantly from cache instead of flashing blank mid-fetch),
  // and measure the tallest one at the box's current width — the box is
  // then locked to that height so rotating slides never reflows the
  // "Horaire" schedule section sitting right below it.
  useEffect(() => {
    if (count === 0 || !wrapRef.current) return;
    const urls = splashes.map((s) => (lang === "en" ? s.image_url_en : s.image_url_fr)).filter(Boolean);
    if (urls.length === 0) return;

    let cancelled = false;
    const recompute = () => {
      const width = wrapRef.current?.clientWidth;
      if (!width) return;
      Promise.all(
        urls.map(
          (url) =>
            new Promise((resolve) => {
              const img = new Image();
              img.onload = () => resolve(img.naturalWidth ? (width / img.naturalWidth) * img.naturalHeight : 0);
              img.onerror = () => resolve(0);
              img.src = url;
            })
        )
      ).then((heights) => {
        if (cancelled) return;
        const max = Math.max(...heights, 0);
        if (max > 0) setBoxHeight(max);
      });
    };

    recompute();
    window.addEventListener("resize", recompute);
    return () => {
      cancelled = true;
      window.removeEventListener("resize", recompute);
    };
  }, [splashes, lang, count]);

  // Caption text length varies a lot between splashes (one line vs. four) —
  // that's a second, independent source of the same reflow problem the box
  // height fix above solves for images. Text height can't be precomputed
  // like an image's natural size, so this renders each caption into an
  // offscreen probe at the caption block's real width and measures it.
  useEffect(() => {
    if (count === 0 || !captionRef.current) return;
    const width = captionRef.current.clientWidth;
    if (!width) return;

    const probe = document.createElement("div");
    probe.style.position = "absolute";
    probe.style.visibility = "hidden";
    probe.style.pointerEvents = "none";
    probe.style.left = "-9999px";
    probe.style.width = `${width}px`;
    probe.className = captionRef.current.className;
    document.body.appendChild(probe);

    let max = 0;
    for (const sp of splashes) {
      const t = (lang === "en" ? sp.title_en : sp.title_fr) || "";
      const d = (lang === "en" ? sp.description_en : sp.description_fr) || "";
      probe.innerHTML = `${t ? `<p class="font-bold text-white text-lg">${t}</p>` : ""}${
        d ? `<p class="text-white/70 text-sm mt-1">${d}</p>` : ""
      }`;
      max = Math.max(max, probe.getBoundingClientRect().height);
    }
    document.body.removeChild(probe);
    if (max > 0) setCaptionHeight(max);
  }, [splashes, lang, count]);

  if (count === 0) return null;

  const s = splashes[Math.min(index, count - 1)];
  const title = (lang === "en" ? s.title_en : s.title_fr) || "";
  const image = (lang === "en" ? s.image_url_en : s.image_url_fr) || "";
  const desc = (lang === "en" ? s.description_en : s.description_fr) || "";
  const isExternalLink = s.cta_url && /^https?:\/\//i.test(s.cta_url);

  const imageEl = (
    <img
      src={image}
      alt={title}
      className="select-none w-full h-full object-contain"
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
      <div
        ref={wrapRef}
        style={boxHeight ? { height: boxHeight } : undefined}
        className={`relative w-full ${BOX_WIDTH_CLASS} mt-6`}
      >
        {count > 1 && (
          <button onClick={prev} aria-label="Previous" className={`${arrowClass} left-2`}>‹</button>
        )}
        {s.cta_url ? (
          isExternalLink ? (
            <a href={s.cta_url} target="_blank" rel="noopener noreferrer" className="block w-full h-full">{imageEl}</a>
          ) : (
            <Link to={s.cta_url} className="block w-full h-full">{imageEl}</Link>
          )
        ) : (
          imageEl
        )}
        {count > 1 && (
          <button onClick={next} aria-label="Next" className={`${arrowClass} right-2`}>›</button>
        )}
      </div>

      <div
        ref={captionRef}
        style={captionHeight ? { minHeight: captionHeight } : undefined}
        className="mt-3 max-w-xl text-center px-4"
      >
        {title && <p className="font-bold text-white text-lg">{title}</p>}
        {desc && <p className="text-white/70 text-sm mt-1">{desc}</p>}
      </div>

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
