import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useI18n } from "../i18n/useI18n";
import PageHero from "../components/PageHero";
import Footer from "../components/Footer";
import MetaTags from "../components/MetaTags";

function formatCoaches(coaches, isFr) {
  if (!coaches) return null;
  const names = coaches.split(",").map((n) => n.trim()).filter(Boolean);
  if (names.length === 0) return null;
  const label = isFr ? "Entraînée par" : "Coached by";
  if (names.length === 1) return `${label} ${names[0]}`;
  const last = names[names.length - 1];
  const rest = names.slice(0, -1).join(", ");
  const and = isFr ? "et" : "and";
  return `${label} ${rest} ${and} ${last}`;
}

function formatTime(t) {
  if (!t) return "";
  const [h, m] = t.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "pm" : "am";
  const display = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${display}:${m} ${ampm}`;
}

function formatDuration(minutes) {
  if (!minutes) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h && m) return `${h}h${String(m).padStart(2, "0")}`;
  if (h) return `${h}h`;
  return `${m}min`;
}

const DAY_NAMES_EN = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const DAY_NAMES_FR = [
  "Dimanche",
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
];

function getDayName(dateStr, lang) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const names = lang === "fr" ? DAY_NAMES_FR : DAY_NAMES_EN;
  return names[d.getUTCDay()];
}

export default function Troupes() {
  const { t } = useI18n();
  const { lang } = useParams();
  const isFr =
    lang === "fr" ||
    (!lang &&
      typeof window !== "undefined" &&
      navigator.language.startsWith("fr"));

  const [troupes, setTroupes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("https://api.swingconnexion.ca/public/troupes")
      .then((r) => r.json())
      .then((data) => {
        setTroupes(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const hero = t("pages.troupes.hero", {});

  return (
    <>
      <MetaTags i18nKey="meta.troupes" path="/troupes" />

      <PageHero
        className="-mt-25"
        imageSrc="/images/troupe_blues.jpg"
        sideImageSrc="/images/troupe_solo.jpg"
        imageAlt="SCX Troupes"
        bandColorVar="var(--color-scx-primary)"
        titleLines={hero.titleLines || (isFr ? ["TROUPES"] : ["TROUPES"])}
        description={
          hero.desc ||
          (isFr
            ? "Nos troupes de performance offrent une expérience de danse avancée pour ceux qui veulent aller plus loin. Intéressé·e? Écrivez-nous!"
            : "Our performance troupes offer an advanced dance experience for those who want to go further. Interested? Write to us!")
        }
        actions={[
          {
            href: (lang ? `/${lang}` : "") + "/contact",
            label: isFr ? "Nous contacter" : "Get in touch",
            bgVar: "var(--color-scx-secondary)",
            fgVar: "#fff",
            internal: true,
          },
        ]}
      />

      <section className="max-w-4xl mx-auto px-6 py-12">
        {loading ? (
          <p className="text-center text-scx-muted">
            {isFr ? "Chargement…" : "Loading…"}
          </p>
        ) : troupes.length === 0 ? (
          <p className="text-center text-scx-muted">
            {isFr ? "Aucune troupe disponible." : "No troupes available."}
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {troupes.map((troupe) => (
              <div
                key={troupe.idtroupes}
                className="rounded-2xl border border-scx-ink/10 bg-white shadow-sm p-6 flex flex-col gap-2"
              >
                <h2 className="text-xl font-bold text-scx-primary">
                  {troupe.name_en}
                </h2>
                <div className="text-sm text-scx-muted flex flex-col gap-1">
                  {troupe.start_date && (
                    <span>
                      {getDayName(troupe.start_date, lang)} &mdash;{" "}
                      {formatTime(troupe.time)}
                      {troupe.duration
                        ? ` (${formatDuration(troupe.duration)})`
                        : ""}
                    </span>
                  )}
                  {!troupe.end_date && (
                    <span className="inline-block mt-1 text-xs font-semibold uppercase tracking-wide text-emerald-600">
                      {isFr ? "Ouvert" : "Open"}
                    </span>
                  )}
                  {(isFr ? troupe.desc_fr : troupe.desc_en) && (
                    <p className="mt-2 text-scx-ink/70 text-sm leading-relaxed">
                      {isFr ? troupe.desc_fr : troupe.desc_en}
                    </p>
                  )}
                  {formatCoaches(troupe.coaches, isFr) && (
                    <p className="mt-1 text-xs text-scx-muted italic">
                      {formatCoaches(troupe.coaches, isFr)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <Footer
        bgVar="var(--color-scx-accent)"
        stripeVar="#22c55e"
        fgVar="#fff"
      />
    </>
  );
}
