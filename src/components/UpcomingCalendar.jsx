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

function buildEvents(apiClasses, lang, onlyUpcoming = false) {
  const todayKey = toLocalDateKey(new Date());

  return apiClasses
    .filter((c) => {
      if (!c.date) return false;
      const lastDate = c.duration_weeks
        ? toLocalDateKey(new Date(new Date(c.date + "T12:00:00").getTime() + (c.duration_weeks - 1) * 7 * 86400000))
        : c.date;
      if (lastDate < todayKey) return false;
      if (onlyUpcoming && c.date < todayKey) return false;
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
      };
    })
    .filter((e) => e.dayIndex >= 0 && !!e.timeKey);
}

function buildTroupeEvents(troupes, lang) {
  // Find the next occurrence of a given day-of-week from today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return troupes
    .filter((t) => t.start_date && t.time)
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
  const lang = langParam === "fr" ? "fr" : "en";

  const [apiClasses, setApiClasses] = useState([]);
  const [apiTroupes, setApiTroupes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [onlyUpcoming, setOnlyUpcoming] = useState(false);

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

  const classEvents = buildEvents(apiClasses, lang, onlyUpcoming);
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
              <label className="flex items-center gap-2 cursor-pointer select-none mt-1">
                <input
                  type="checkbox"
                  checked={onlyUpcoming}
                  onChange={(e) => setOnlyUpcoming(e.target.checked)}
                  className="w-4 h-4 rounded accent-[color:var(--color-scx-primary)] cursor-pointer"
                />
                <span className="text-sm text-white/70">
                  {lang === "fr" ? "À venir seulement" : "Upcoming only"}
                </span>
              </label>
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
                          className={`grid grid-cols-[1fr_auto] items-start gap-x-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 transition-colors cursor-pointer hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30`}
                          style={{ boxShadow: e.isTroupe ? "inset 4px 0 0 0 var(--color-scx-accent)" : "inset 4px 0 0 0 var(--color-scx-primary)" }}
                          title={e.desc || e.name}>
                          <div className="min-w-0 text-left">
                            <div className="text-base font-semibold leading-tight truncate">{e.shortName}</div>
                            <div className="mt-0.5 text-sm text-white/60">
                              {fmtTimeLabel(e.timeKey)}
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
                                  className={`rounded-xl border border-white/10 px-3 py-2 bg-white/5 transition-colors cursor-pointer hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30`}
                                  style={{ boxShadow: e.isTroupe ? "inset 4px 0 0 0 var(--color-scx-accent)" : "inset 4px 0 0 0 var(--color-scx-primary)" }}
                                  title={e.desc || e.name}>
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
