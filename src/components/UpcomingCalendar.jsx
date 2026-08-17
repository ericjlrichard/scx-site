// UpcomingCalendar.jsx — Live weekly class schedule grid
//
// Used on: Landing (homepage) and GroupClasses page.
// Data sources:
//   - GET /public/classes   → regular and summer classes (filtered to not-yet-past)
//   - GET /public/troupes   → summer troupes (displayed by their recurring weekday)
//
// Layout:
//   - Mobile: stacked cards grouped by day
//   - Desktop: time × weekday grid (like a calendar)
//
// Color coding: cyan = upcoming class, green = ongoing, yellow = summer project, blue = troupe
// Clicking a class card links to /signup?class=ID; clicking a troupe card links to /troupes.
// Troupes are shown at their next upcoming occurrence of the same weekday (not the original date).

import { useState, useEffect } from "react";
import { useI18n } from "../i18n/useI18n";
import { useParams, Link } from "react-router-dom";

const DAY_LABELS = {
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  fr: ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"],
};

function formatHumanDate(dateKey, lang) {
  if (!dateKey) return "";
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);

  if (lang === "fr") {
    return new Intl.DateTimeFormat("fr-CA", { day: "numeric", month: "long" }).format(date);
  }

  const day = date.getDate();
  const suffix =
    day % 10 === 1 && day !== 11 ? "st"
    : day % 10 === 2 && day !== 12 ? "nd"
    : day % 10 === 3 && day !== 13 ? "rd"
    : "th";
  const month = new Intl.DateTimeFormat("en-US", { month: "long" }).format(date);
  return `${month} ${day}${suffix}`;
}

function toLocalDateKey(d = new Date()) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function dayIndexFromDateKey(dateKey) {
  const [y, m, d] = String(dateKey || "").split("-").map((v) => parseInt(v, 10));
  if (!y || !m || !d) return -1;
  return new Date(y, m - 1, d).getDay();
}

function timeToKey(time) {
  // "19:00" → "1900"
  return String(time || "").replace(":", "").slice(0, 4);
}

function fmtDuration(minutes) {
  if (!minutes) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h && m) return `${h}h${String(m).padStart(2, "0")}`;
  if (h) return `${h}h`;
  return `${m}min`;
}

function fmtTimeLabel(timeKey) {
  const hh = parseInt(timeKey.slice(0, 2), 10);
  const mm = timeKey.slice(2);
  const hour12 = ((hh + 11) % 12) + 1;
  const ampm = hh < 12 ? "am" : "pm";
  return `${hour12}:${mm} ${ampm}`;
}

function shortTitle(fullName = "") {
  return fullName.split(" - ")[0].split(" — ")[0].trim();
}

// The classic folded-newspaper hat silhouette — a peaked crown with a brim
// and two triangular flaps sticking out the sides, not a birthday-party
// cone. Center crease + brim fold lines are the paper-fold detail.
function PaperHatIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M12 2 L16 11 L22 8 L20 17 L19 18 L5 18 L4 17 L2 8 L8 11 Z"
        fill="var(--color-scx-primary)"
        stroke="#1a1a1a"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      <path d="M12 2 L12 18" stroke="#1a1a1a" strokeWidth="0.75" opacity="0.35" />
      <path d="M8 11 L16 11" stroke="#1a1a1a" strokeWidth="0.75" opacity="0.35" />
    </svg>
  );
}

// Perched in a card's top-right corner to flag classes that accept
// drop-ins, since that's otherwise buried in the signup flow and easy to
// miss just glancing at the grid.
function DropInHat({ lang }) {
  return (
    <span
      className="absolute -top-2 -right-2 w-6 h-6 drop-shadow-md"
      title={lang === "fr" ? "À la carte disponible" : "Drop-ins available"}
    >
      <PaperHatIcon className="w-full h-full rotate-[40deg]" />
    </span>
  );
}

const COLORS = {
  troupe:  "#3b82f6", // blue
  summer:  "#eab308", // yellow
  ongoing: "#86efac", // light green
  future:  "#22d3ee", // cyan
};

function getEventColor(e) {
  if (e.isTroupe) return COLORS.troupe;
  if (e.isSummer) return COLORS.summer;
  if (e.isOngoing) return COLORS.ongoing;
  return COLORS.future;
}

function buildEvents(apiClasses, lang) {
  const todayKey = toLocalDateKey(new Date());

  return apiClasses
    .filter((c) => {
      if (!c.date) return false;
      const lastDate = c.duration_weeks
        ? toLocalDateKey(new Date(new Date(c.date + "T12:00:00").getTime() + (c.duration_weeks - 1) * 7 * 86400000))
        : c.date;
      if (lastDate < todayKey) return false;
      return true;
    })
    .map((c) => {
      const name = c.name?.[lang] || c.name?.en || "";
      const desc = c.desc?.[lang] || c.desc?.en || "";
      const timeKey = timeToKey(c.time);
      const dayIndex = dayIndexFromDateKey(c.date);
      return {
        id: c.id,
        dayIndex,
        timeKey,
        name,
        shortName: shortTitle(name),
        desc,
        startDate: c.date,
        price: c.price,
        link: c.square_link || null,
        isSummer: !!c.is_summer,
        isOngoing: c.date < todayKey,
        isDropin: !!c.is_dropin,
        durationWeeks: c.duration_weeks || null,
        durationMins: c.duration || null,
      };
    })
    .filter((e) => e.dayIndex >= 0 && !!e.timeKey);
}

function buildTroupeEvents(troupes, lang) {
  // Find the next occurrence of a given day-of-week from today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = toLocalDateKey(today);

  return troupes
    .filter((t) => {
      if (!t.start_date || !t.time) return false;
      if (t.end_date && t.end_date < todayKey) return false;
      return true;
    })
    .map((t) => {
      const startD = new Date(t.start_date);
      const dow = startD.getUTCDay(); // day of week from start_date

      // Find the upcoming date for this weekday
      const diff = (dow - today.getDay() + 7) % 7;
      const upcoming = new Date(today);
      upcoming.setDate(today.getDate() + diff);
      const dateKey = toLocalDateKey(upcoming);

      const name = (lang === "fr" ? t.name_fr : t.name_en) || t.name_en || "";
      return {
        id: `troupe-${t.idtroupes}`,
        dayIndex: dow,
        timeKey: timeToKey(t.time),
        name,
        shortName: shortTitle(name),
        desc: (lang === "fr" ? t.desc_fr : t.desc_en) || "",
        startDate: dateKey,
        isTroupe: true,
      };
    })
    .filter((e) => e.dayIndex >= 0 && !!e.timeKey);
}

function groupByDay(events) {
  const byDay = Array.from({ length: 7 }, () => []);
  for (const e of events) byDay[e.dayIndex].push(e);
  for (const dayEvents of byDay) {
    dayEvents.sort((a, b) => String(a.timeKey).localeCompare(String(b.timeKey)));
  }
  return byDay;
}

export default function UpcomingCalendar() {
  const { t } = useI18n();
  const { lang: langParam } = useParams();
  const lang = langParam === "en" ? "en" : "fr";

  const [apiClasses, setApiClasses] = useState([]);
  const [apiTroupes, setApiTroupes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("https://api.swingconnexion.com/public/classes").then((r) => r.json()).catch(() => []),
      fetch("https://api.swingconnexion.com/public/troupes").then((r) => r.json()).catch(() => []),
    ]).then(([classes, troupes]) => {
      setApiClasses(Array.isArray(classes) ? classes : []);
      setApiTroupes(Array.isArray(troupes) ? troupes : []);
      setLoading(false);
    });
  }, []);

  const classEvents = buildEvents(apiClasses, lang);
  const troupeEvents = buildTroupeEvents(apiTroupes, lang);
  const events = [...classEvents, ...troupeEvents];
  const byDay = groupByDay(events);
  const dayLabels = DAY_LABELS[lang];

  // Derive timeslots from actual data
  const timeslotKeys = [...new Set(events.map((e) => e.timeKey))].sort();

  const cellEvents = (dayIndex, timeKey) =>
    byDay[dayIndex].filter((e) => e.timeKey === timeKey);

  const uiTimeLabel = lang === "fr" ? "Heure" : "Time";
  const uiStartsLabel = lang === "fr" ? "Débute" : "Starts";
  const uiEmpty =
    lang === "fr"
      ? "Aucun cours à venir pour le moment."
      : "No upcoming classes at the moment.";

  const troupesPath = langParam ? `/${langParam}/troupes` : "/troupes";
  const signupPath = (id) => (langParam ? `/${langParam}/signup` : "/signup") + `?class=${id}`;

  const CardWrapper = ({ href, to, className, style, title, children }) => {
    if (to) {
      return <Link to={to} className={className} style={style} title={title}>{children}</Link>;
    }
    if (href) {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer"
          className={className} style={style} title={title}>
          {children}
        </a>
      );
    }
    return <div className={className} style={style} title={title}>{children}</div>;
  };

  if (loading) {
    return (
      <section className="relative text-white">
        <div className="mx-auto max-w-6xl px-4 pb-12">
          <div className="rounded-3xl border border-white/10 bg-[color:var(--color-scx-secondary)]/70 backdrop-blur-md shadow-2xl p-10 text-center text-white/50">
            {lang === "fr" ? "Chargement…" : "Loading…"}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative text-white">
      <div className="mx-auto max-w-6xl px-4 pb-12">
        <div className="rounded-3xl border border-white/10 bg-[color:var(--color-scx-secondary)]/70 backdrop-blur-md shadow-2xl">
          <div className="px-6 pt-7 pb-5 md:px-8">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <h3 className="text-2xl md:text-3xl font-semibold tracking-tight"
                style={{ color: "var(--color-scx-primary)" }}>
                {t?.("pages.landing.upcomingTitle") ||
                  (lang === "fr" ? "Cours à venir" : "Upcoming classes")}
              </h3>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                {[
                  { color: COLORS.future,  labelFr: "Cours à venir",   labelEn: "Upcoming class" },
                  { color: COLORS.ongoing, labelFr: "Cours en cours",  labelEn: "Ongoing class" },
                  { color: COLORS.summer,  labelFr: "Projet d'été",    labelEn: "Summer project" },
                  { color: COLORS.troupe,  labelFr: "Troupe",          labelEn: "Troupe" },
                ].map(({ color, labelFr, labelEn }) => (
                  <span key={color} className="flex items-center gap-1.5 text-xs text-white/60">
                    <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: color }} />
                    {lang === "fr" ? labelFr : labelEn}
                  </span>
                ))}
                <span className="flex items-center gap-1.5 text-xs text-white/60">
                  <PaperHatIcon className="w-3.5 h-3.5 shrink-0" />
                  {lang === "fr" ? "À la carte disponible" : "Drop-in available"}
                </span>
              </div>
            </div>

            {/* Mobile: list by day */}
            <div className="mt-6 md:hidden space-y-6">
              {byDay.map((dayEvents, dayIndex) => {
                if (!dayEvents.length) return null;
                return (
                  <div key={dayIndex} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-xl font-semibold" style={{ color: "var(--color-scx-accent)" }}>
                      {dayLabels[dayIndex]}
                    </div>
                    <div className="mt-3 space-y-2">
                      {dayEvents.map((e) => (
                        <CardWrapper key={e.id}
                          href={undefined}
                          to={e.isTroupe ? troupesPath : signupPath(e.id)}
                          className={`relative grid grid-cols-[1fr_auto] items-start gap-x-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 transition-colors cursor-pointer hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30`}
                          style={{ boxShadow: `inset 4px 0 0 0 ${getEventColor(e)}` }}
                          title={e.desc || e.name}>
                          {e.isDropin && <DropInHat lang={lang} />}
                          <div className="min-w-0 text-left">
                            <div className="text-base font-semibold leading-tight truncate">{e.shortName}</div>
                            <div className="mt-0.5 text-sm text-white/60">
                              {fmtTimeLabel(e.timeKey)}
                              {!e.isTroupe && e.startDate && (
                                <span className="ml-2 text-white/40">· {uiStartsLabel} {formatHumanDate(e.startDate, lang)}</span>
                              )}
                              {!e.isTroupe && e.durationMins && (
                                <span className="ml-2 text-white/40">· {fmtDuration(e.durationMins)}</span>
                              )}
                              {!e.isTroupe && e.durationWeeks && (
                                <span className="ml-2 text-white/40">· {e.durationWeeks} {lang === "fr" ? "sem." : "wks"}</span>
                              )}
                            </div>
                            {e.desc ? (
                              <div className="mt-1 text-sm text-white/70 line-clamp-2">{e.desc}</div>
                            ) : null}
                          </div>
                        </CardWrapper>
                      ))}
                    </div>
                  </div>
                );
              })}
              {!events.length ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-white/80">{uiEmpty}</div>
              ) : null}
            </div>

            {/* Desktop/tablet: grid */}
            <div className="mt-6 hidden md:block">
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/20">
                {/* Header row */}
                <div className="grid grid-cols-[110px_repeat(7,minmax(0,1fr))] border-b border-white/10 relative">
                  <div className="absolute inset-x-0 bottom-0 h-[2px]"
                    style={{ backgroundColor: "var(--color-scx-primary)" }} />
                  <div className="p-4 text-sm text-white/70">{uiTimeLabel}</div>
                  {dayLabels.map((label, idx) => (
                    <div key={idx} className="p-4 text-sm font-semibold text-white/90 border-l border-white/10">
                      {label}
                    </div>
                  ))}
                </div>

                {/* Body */}
                {timeslotKeys.map((timeKey) => (
                  <div key={timeKey}
                    className="grid grid-cols-[110px_repeat(7,minmax(0,1fr))] border-b last:border-b-0 border-white/10">
                    <div className="p-4 text-sm text-white/80 tabular-nums">
                      {fmtTimeLabel(timeKey)}
                    </div>
                    {Array.from({ length: 7 }, (_, dayIndex) => {
                      const items = cellEvents(dayIndex, timeKey);
                      return (
                        <div key={dayIndex} className="p-3 border-l border-white/10 min-h-[76px]">
                          {items.length ? (
                            <div className="flex flex-col gap-2">
                              {items.map((e) => (
                                <CardWrapper key={e.id}
                                  href={undefined}
                                  to={e.isTroupe ? troupesPath : signupPath(e.id)}
                                  className={`relative rounded-xl border border-white/10 px-3 py-2 bg-white/5 transition-colors cursor-pointer hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30`}
                                  style={{ boxShadow: `inset 4px 0 0 0 ${getEventColor(e)}` }}
                                  title={e.desc || e.name}>
                                  {e.isDropin && <DropInHat lang={lang} />}
                                  <div className="text-sm font-semibold leading-tight text-white">{e.shortName}</div>
                                  {!e.isTroupe && (
                                    <div className="text-xs text-white/70 mt-0.5">
                                      {uiStartsLabel} {formatHumanDate(e.startDate, lang)}
                                    </div>
                                  )}
                                </CardWrapper>
                              ))}
                            </div>
                          ) : (
                            <div className="h-full rounded-xl border border-dashed border-white/15 bg-[color:var(--color-scx-ink)]/30" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>

              {!events.length ? (
                <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-5 text-white/80">{uiEmpty}</div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
