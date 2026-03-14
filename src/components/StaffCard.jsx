// src/components/StaffCard.jsx
import { useId, useState } from "react";
import { Link, useParams } from "react-router-dom";

export default function StaffCard({
  name,
  title,
  image,
  bio,
  ctaLabel,
  defaultOpen = false,
}) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();

  // Build localized contact link
  const { lang } = useParams();
  const prefix = lang ? `/${lang}` : "";
  const subject = (lang || "fr").startsWith("en")
    ? "Private lesson request"
    : "Demande de cours privé";
  const contactUrl = `${prefix}/contact?subject=${encodeURIComponent(subject)}`;

  return (
    <article className="bg-scx-secondary text-white rounded-2xl overflow-hidden shadow-md">
      {/* Top banner image */}
      <div className="relative">
        <img
          src={image}
          alt={`Portrait de ${name} (Swing ConneXion)`}
          className="w-full h-28 md:h-32 object-cover object-center"
          loading="lazy"
        />
      </div>

      {/* Header (toggle) */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className="w-full flex items-start justify-between gap-4 px-4 pt-4 pb-3"
      >
        <div className="min-w-0 flex-1 text-left">
          <h2 className="text-lg md:text-xl font-extrabold leading-tight">
            {name}
          </h2>
          <p className="text-white/80 -mt-0.5">{title}</p>
        </div>
        <img
          src={
            open
              ? "/icons/SCX_icon_arrow_up_jaune.png"
              : "/icons/SCX_icon_arrow_down_jaune.png"
          }
          alt=""
          className="h-4 w-4 mt-1 flex-none"
        />
      </button>

      {/* Collapsible content */}
      <div
        id={panelId}
        className={
          "px-4 pb-4 overflow-hidden transition-[max-height,opacity] duration-300 " +
          (open ? "max-h-[480px] opacity-100" : "max-h-0 opacity-0")
        }
      >
        <p className="text-sm md:text-[15px] leading-relaxed text-white/90">
          {bio}
        </p>

        {ctaLabel && (
          <div className="mt-4">
            <Link
              to={contactUrl}
              className="inline-flex items-center justify-center px-4 py-3 rounded-xl font-extrabold bg-[var(--color-scx-primary)] text-white hover:opacity-95 transition"
            >
              {ctaLabel}
              <span aria-hidden className="ml-2">
                ›
              </span>
            </Link>
          </div>
        )}
      </div>
    </article>
  );
}
