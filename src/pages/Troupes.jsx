// Troupes.jsx — "Summer Projects" page (/troupes)
// Shows two categories fetched from the API:
//   - Summer classes  (GET /public/classes filtered to is_summer && !is_pass)
//   - Summer troupes  (GET /public/summer-troupes — performance groups like Blues Troupe)
// Summer class cards link to /signup?class=ID (SignUp.jsx).
// Summer troupes are informational only on this page; registration is via SummerSignUp.jsx.

import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useI18n } from "../i18n/useI18n";
import PageHero from "../components/PageHero";
import Footer from "../components/Footer";
import MetaTags from "../components/MetaTags";

const API = "https://api.swingconnexion.com/public";

function formatTime(t) {
  if (!t) return "";
  const [h, m] = t.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "pm" : "am";
  const display = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${display}:${m} ${ampm}`;
}

const DAY_NAMES_FR = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const DAY_NAMES_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function getDayName(dateStr, isFr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T12:00:00");
  return (isFr ? DAY_NAMES_FR : DAY_NAMES_EN)[d.getDay()];
}

function ProjectCard({ children }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 flex flex-col gap-3 backdrop-blur-sm">
      {children}
    </div>
  );
}

export default function Troupes() {
  const { t } = useI18n();
  const { lang } = useParams();
  const isFr = lang === "fr" || (!lang && typeof window !== "undefined" && navigator.language.startsWith("fr"));
  const locale = isFr ? "fr" : "en";
  const prefix = lang ? `/${lang}` : "";

  const [summerClasses, setSummerClasses] = useState([]);
  const [summerTroupes, setSummerTroupes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/classes`).then((r) => r.json()).catch(() => []),
      fetch(`${API}/summer-troupes`).then((r) => r.json()).catch(() => []),
    ]).then(([classes, troupes]) => {
      setSummerClasses(Array.isArray(classes) ? classes.filter((c) => c.is_summer && !c.is_pass) : []);
      setSummerTroupes(Array.isArray(troupes) ? troupes : []);
      setLoading(false);
    });
  }, []);

  const hasContent = summerClasses.length > 0 || summerTroupes.length > 0;

  return (
    <>
      <MetaTags i18nKey="meta.troupes" path="/troupes" />

      <PageHero
        className="-mt-25"
        imageSrc="/images/troupe_blues.jpg"
        sideImageSrc="/images/troupe_solo.jpg"
        imageAlt="SCX Summer Projects"
        bandColorVar="var(--color-scx-primary)"
        titleLines={isFr ? ["PROJETS D'ÉTÉ"] : ["SUMMER PROJECTS"]}
        description={
          isFr
            ? "Inscrivez-vous à 2 projets d'été et profitez du tarif 2 pour 1 !"
            : "Sign up for 2 summer projects and get the 2-for-1 rate!"
        }
        actions={[
          {
            href: `${prefix}/signup`,
            label: isFr ? "S'inscrire" : "Register",
            bgVar: "var(--color-scx-secondary)",
            fgVar: "#fff",
            internal: true,
          },
        ]}
      />

      <section className="bg-[color:var(--color-scx-secondary)] text-white min-h-[40vh]">
        <div className="max-w-5xl mx-auto px-6 py-12">
          {loading ? (
            <p className="text-center text-white/50">{isFr ? "Chargement…" : "Loading…"}</p>
          ) : !hasContent ? (
            <p className="text-center text-white/50">
              {isFr ? "Aucun projet d'été pour le moment." : "No summer projects at the moment."}
            </p>
          ) : (
            <div className="space-y-10">
              {/* Summer classes */}
              {summerClasses.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold mb-4" style={{ color: "var(--color-scx-primary)" }}>
                    {isFr ? "Cours d'été" : "Summer Classes"}
                  </h2>
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {summerClasses.map((cls) => {
                      const name = cls.name?.[locale] || cls.name?.fr || "";
                      const desc = cls.desc?.[locale] || cls.desc?.fr || "";
                      const day = getDayName(cls.date, isFr);
                      const price = Number(cls.price) || 0;
                      return (
                        <ProjectCard key={cls.id}>
                          <h3 className="text-lg font-bold text-white">{name}</h3>
                          {(day || cls.time) && (
                            <p className="text-sm text-white/60">
                              {day}{day && cls.time ? " — " : ""}{formatTime(cls.time)}
                              {cls.duration_weeks ? ` · ${cls.duration_weeks} ${isFr ? "semaines" : "weeks"}` : ""}
                            </p>
                          )}
                          {desc && <p className="text-sm text-white/70 leading-relaxed flex-1">{desc}</p>}
                          <div className="flex items-center justify-between mt-auto pt-2">
                            <span className="font-bold text-lg" style={{ color: "var(--color-scx-primary)" }}>
                              ${price.toFixed(2)}
                            </span>
                            <Link
                              to={`${prefix}/signup?class=${cls.id}`}
                              className="rounded-full px-4 py-1.5 text-sm font-semibold transition-opacity hover:opacity-80"
                              style={{ backgroundColor: "var(--color-scx-primary)", color: "var(--color-scx-ink)" }}
                            >
                              {isFr ? "S'inscrire →" : "Register →"}
                            </Link>
                          </div>
                        </ProjectCard>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Summer troupes */}
              {summerTroupes.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold mb-4" style={{ color: "var(--color-scx-primary)" }}>
                    {isFr ? "Troupes d'été" : "Summer Troupes"}
                  </h2>
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {summerTroupes.map((troupe) => {
                      const name = isFr ? troupe.name_fr : troupe.name_en;
                      const desc = isFr ? troupe.desc_fr : troupe.desc_en;
                      const day = getDayName(troupe.start_date, isFr);
                      const price = Number(troupe.price) || 0;
                      return (
                        <ProjectCard key={troupe.idtroupes}>
                          <h3 className="text-lg font-bold text-white">{name}</h3>
                          {(day || troupe.time) && (
                            <p className="text-sm text-white/60">
                              {day}{day && troupe.time ? " — " : ""}{formatTime(troupe.time)}
                            </p>
                          )}
                          {troupe.studio_name && (
                            <p className="text-xs text-white/40">{troupe.studio_name}</p>
                          )}
                          {desc && <p className="text-sm text-white/70 leading-relaxed flex-1">{desc}</p>}
                          {price > 0 && (
                            <span className="font-bold text-lg mt-auto" style={{ color: "var(--color-scx-primary)" }}>
                              ${price.toFixed(2)}
                            </span>
                          )}
                        </ProjectCard>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </>
  );
}
