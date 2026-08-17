// SummerSignUp.jsx — Registration form for summer TROUPES (performance groups)
//
// This is NOT the form for summer classes — those go through SignUp.jsx with ?class=ID.
// This form is specifically for troupes: Blues Troupe, etc.
//
// Data flow:
//   - Fetches troupe list from GET /public/summer-troupes
//   - Submits registration to POST /public/register-summer
//
// 2-for-1: if exactly 2 troupes are selected, each is shown at half price (isBundle logic)
// Monthly billing: prices shown as /mois — troupe fees are billed monthly
// Bot protection: reCAPTCHA v3 + startTimeRef (elapsed time since page load)

import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useI18n } from "../i18n/useI18n";
import Footer from "../components/Footer";
import Container from "../components/Container";

const API = "https://api.swingconnexion.com/public";
const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

function loadRecaptcha() {
  if (document.getElementById("recaptcha-script")) return;
  const s = document.createElement("script");
  s.id = "recaptcha-script";
  s.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`;
  s.async = true;
  document.head.appendChild(s);
}

function getRecaptchaToken() {
  return new Promise((resolve, reject) => {
    if (!window.grecaptcha) return resolve(null);
    window.grecaptcha.ready(() => {
      window.grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: "summer_signup" }).then(resolve).catch(reject);
    });
  });
}

function fmt(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr + "T12:00:00").toLocaleDateString("fr-CA", { day: "numeric", month: "long" });
}

function fmtTime(timeStr) {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":");
  const hour = parseInt(h);
  return `${hour % 12 || 12}h${m !== "00" ? m : ""}`;
}

function dayOfWeek(dateStr, lang) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString(lang === "fr" ? "fr-CA" : "en-CA", { weekday: "long" });
}

// ── Sun decoration ────────────────────────────────────────────
function SunSVG({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="100" cy="100" r="42" fill="currentColor" opacity="0.9" />
      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
        <rect
          key={deg}
          x="96" y="12" width="8" height="28" rx="4"
          fill="currentColor" opacity="0.7"
          transform={`rotate(${deg} 100 100)`}
        />
      ))}
    </svg>
  );
}

// ── Step indicator ─────────────────────────────────────────────
const STEPS = ["projects", "info", "review"];

function StepIndicator({ step, lang }) {
  const labels = {
    fr: { projects: "Projets", info: "Vos infos", review: "Confirmation" },
    en: { projects: "Projects", info: "Your Info", review: "Review" },
  }[lang] || {};

  return (
    <div className="flex items-center justify-center gap-0 mb-10">
      {STEPS.map((s, i) => {
        const current = s === step;
        const done = STEPS.indexOf(step) > i;
        return (
          <div key={s} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                done ? "bg-amber-400 text-amber-900" : current ? "bg-white text-amber-700" : "bg-white/20 text-white/40"
              }`}>
                {done ? "✓" : i + 1}
              </div>
              <span className={`mt-1.5 text-[11px] uppercase tracking-wide font-semibold ${
                current ? "text-white" : done ? "text-amber-300" : "text-white/40"
              }`}>
                {labels[s]}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-12 md:w-20 h-px mx-2 mb-5 transition-colors ${done ? "bg-amber-400" : "bg-white/20"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Project card ───────────────────────────────────────────────
function ProjectCard({ troupe, selected, onToggle, lang, bundleActive }) {
  const [descOpen, setDescOpen] = useState(false);
  const name = lang === "fr" ? troupe.name_fr : troupe.name_en;
  const desc = lang === "fr" ? troupe.desc_fr : troupe.desc_en;
  const day = dayOfWeek(troupe.start_date, lang);
  const price = bundleActive ? Number(troupe.price) / 2 : Number(troupe.price);
  const disabled = !selected && bundleActive;

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={`relative w-full text-left rounded-3xl border-2 p-5 transition-all duration-200 focus:outline-none ${
        selected
          ? "border-amber-400 bg-amber-400/10 shadow-[0_0_32px_rgba(251,191,36,0.2)]"
          : disabled
          ? "border-white/10 bg-white/5 opacity-40 cursor-not-allowed"
          : "border-white/15 bg-white/5 hover:border-amber-400/50 hover:bg-amber-400/5"
      }`}
    >
      {selected && (
        <div className="absolute top-4 right-4 w-7 h-7 rounded-full bg-amber-400 flex items-center justify-center">
          <span className="text-amber-900 font-bold text-sm">✓</span>
        </div>
      )}

      <div className="flex gap-2 flex-wrap mb-3">
        {day && (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide bg-amber-400/20 text-amber-300 border border-amber-400/30">
            {day}
          </span>
        )}
        {troupe.time && (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/10 text-white/70">
            {fmtTime(troupe.time)}
          </span>
        )}
        {troupe.studio_name && (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/10 text-white/60">
            {troupe.studio_name}
          </span>
        )}
      </div>

      <h3 className="text-lg font-bold text-white mb-1">{name}</h3>

      {troupe.coaches && (
        <p className="text-sm text-amber-300/80 mb-2">
          {lang === "fr" ? "Avec" : "With"} {troupe.coaches}
        </p>
      )}

      {desc && (
        <div className="mb-3">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setDescOpen((o) => !o); }}
            className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white/80 transition-colors"
          >
            <svg
              className={`w-3.5 h-3.5 transition-transform duration-200 ${descOpen ? "rotate-90" : ""}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            {descOpen ? (lang === "fr" ? "Masquer" : "Hide") : (lang === "fr" ? "Description" : "Description")}
          </button>
          {descOpen && (
            <p className="mt-2 text-sm text-white/60 leading-relaxed">{desc}</p>
          )}
        </div>
      )}

      <div className="flex items-end justify-between mt-auto pt-3 border-t border-white/10">
        <div>
          {troupe.start_date && troupe.end_date && (
            <p className="text-xs text-white/50">{fmt(troupe.start_date)} → {fmt(troupe.end_date)}</p>
          )}
        </div>
        <div className="text-right">
          {bundleActive && selected && (
            <p className="text-xs text-white/40 line-through">${Number(troupe.price).toFixed(2)}</p>
          )}
          <p className={`text-xl font-extrabold ${selected && bundleActive ? "text-amber-400" : "text-white"}`}>
            ${price.toFixed(2)}
            <span className="text-sm font-normal text-white/50">/mois</span>
          </p>
        </div>
      </div>
    </button>
  );
}

// ── Field ──────────────────────────────────────────────────────
function Field({ label, children }) {
  return (
    <div className="mb-4">
      <label className="block text-[12px] uppercase tracking-wide text-white/70 mb-1.5 font-semibold">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full bg-white/10 border border-white/15 rounded-2xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 transition";

// ── Role button ────────────────────────────────────────────────
function RoleButton({ value, selected, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 py-3 rounded-2xl font-semibold text-sm transition-all border ${
        selected
          ? "bg-amber-400 border-amber-400 text-amber-900"
          : "bg-white/10 border-white/15 text-white/60 hover:bg-white/20 hover:border-white/30"
      }`}
    >
      {children}
    </button>
  );
}

// ── Main component ─────────────────────────────────────────────
export default function SummerSignUp() {
  const { lang } = useI18n();
  const fr = lang !== "en";

  const [step, setStep] = useState("projects");
  const [troupes, setTroupes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", role: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const startTimeRef = useRef(Date.now());

  // Single-page step flow (no route change between steps), so React
  // Router's scroll restoration never kicks in — without this, advancing a
  // step while scrolled down leaves the next step's content below the
  // fold, looking like the page did nothing.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  // "How did you hear about us?" — this form has no new/returning toggle, so it's always
  // shown; the backend's find-or-create-by-email logic makes it a no-op for a returning student.
  const [referralSources, setReferralSources] = useState([]);
  const [selectedReferralSources, setSelectedReferralSources] = useState([]);

  useEffect(() => {
    loadRecaptcha();
    fetch(`${API}/summer-troupes`)
      .then((r) => r.json())
      .then(setTroupes)
      .catch(() => setTroupes([]))
      .finally(() => setLoading(false));
    fetch(`${API}/referral-sources`).then((r) => r.json()).then(setReferralSources).catch(() => {});
  }, []);

  const isBundle = selected.length === 2;
  const totalPrice = selected.reduce((sum, t) => sum + (isBundle ? Number(t.price) / 2 : Number(t.price)), 0);

  function toggleTroupe(troupe) {
    setSelected((prev) => {
      const already = prev.find((t) => t.idtroupes === troupe.idtroupes);
      if (already) return prev.filter((t) => t.idtroupes !== troupe.idtroupes);
      if (prev.length >= 2) return prev;
      return [...prev, troupe];
    });
  }

  function setField(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSubmit() {
    setError("");
    setSubmitting(true);
    try {
      const recaptchaToken = await getRecaptchaToken().catch(() => null);
      const res = await fetch(`${API}/register-summer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          honeypot: "",
          elapsedMs: Date.now() - startTimeRef.current,
          recaptchaToken,
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
          role: form.role,
          troupeIds: selected.map((t) => t.idtroupes),
          referralSourceIds: selectedReferralSources,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur / Error");
      setStep("done");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const canGoToInfo = selected.length > 0;
  const canGoToReview =
    form.firstName.trim() &&
    form.lastName.trim() &&
    form.email.includes("@") &&
    form.role;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--color-scx-secondary)" }}>

      {/* ── Hero ── */}
      <div className="relative overflow-hidden">
        <img
          src="/images/troupe_high_five.jpg"
          alt={fr ? "Danseurs SCX" : "SCX dancers"}
          className="w-full h-[55vh] md:h-[65vh] object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-amber-900/20 via-black/40 to-[var(--color-scx-secondary)]" />

        {/* Decorative sun */}
        <SunSVG className="absolute top-6 right-8 w-28 md:w-40 text-amber-300 opacity-30 rotate-12" />
        <SunSVG className="absolute -bottom-6 -left-10 w-36 md:w-52 text-amber-400 opacity-10 -rotate-6" />

        <div className="absolute inset-0 flex flex-col items-center justify-end pb-10 px-4 text-center">
          <span className="inline-block mb-3 px-4 py-1.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs font-bold uppercase tracking-widest">
            {fr ? "Été 2026" : "Summer 2026"}
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight drop-shadow-lg">
            {fr ? "Projets d'été" : "Summer Projects"}
          </h1>
          <p className="mt-3 text-white/80 text-base md:text-lg max-w-lg">
            {fr
              ? "Inscrivez-vous à 1 ou 2 projets. Choisissez-en 2 et bénéficiez du tarif 2-pour-1 !"
              : "Sign up for 1 or 2 projects. Choose 2 and get the 2-for-1 deal!"}
          </p>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 py-10 md:py-16">
        <Container>
          <div className="mx-auto max-w-3xl">

            {step !== "done" && <StepIndicator step={step} lang={lang} />}

            {/* ── Step: projects ── */}
            {step === "projects" && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">
                    {fr ? "Choisissez vos projets" : "Choose your projects"}
                  </h2>
                  {selected.length > 0 && (
                    <div className="text-right">
                      <p className="text-xs text-white/50 uppercase tracking-wide">
                        {selected.length === 2
                          ? (fr ? "🎉 Offre 2 pour 1" : "🎉 2-for-1 deal")
                          : (fr ? `${selected.length} sélectionné` : `${selected.length} selected`)}
                      </p>
                      <p className="text-xl font-extrabold text-amber-400">${totalPrice.toFixed(2)}/mois</p>
                    </div>
                  )}
                </div>

                {isBundle && (
                  <div className="mb-6 p-4 rounded-2xl bg-amber-400/10 border border-amber-400/30 text-amber-300 text-sm font-medium">
                    🌞 {fr
                      ? "Super ! Vous bénéficiez du tarif 2-pour-1. Chaque projet est à moitié prix."
                      : "Nice! You're getting the 2-for-1 rate. Each project is half price."}
                  </div>
                )}

                {loading ? (
                  <div className="flex justify-center py-16">
                    <div className="w-10 h-10 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
                  </div>
                ) : troupes.length === 0 ? (
                  <p className="text-center text-white/50 py-16">
                    {fr ? "Aucun projet disponible pour le moment." : "No projects available at the moment."}
                  </p>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {troupes.map((t) => (
                      <ProjectCard
                        key={t.idtroupes}
                        troupe={t}
                        selected={!!selected.find((s) => s.idtroupes === t.idtroupes)}
                        onToggle={() => toggleTroupe(t)}
                        lang={lang}
                        bundleActive={isBundle}
                      />
                    ))}
                  </div>
                )}

                <div className="mt-8 flex justify-end">
                  <button
                    onClick={() => setStep("info")}
                    disabled={!canGoToInfo}
                    className={`px-8 py-3.5 rounded-2xl font-bold text-base transition-all ${
                      canGoToInfo
                        ? "bg-amber-400 text-amber-900 hover:bg-amber-300 shadow-lg shadow-amber-400/20"
                        : "bg-white/10 text-white/30 cursor-not-allowed"
                    }`}
                  >
                    {fr ? "Continuer →" : "Continue →"}
                  </button>
                </div>
              </div>
            )}

            {/* ── Step: info ── */}
            {step === "info" && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">
                  {fr ? "Vos informations" : "Your information"}
                </h2>

                <div className="grid md:grid-cols-2 gap-x-4">
                  <Field label={fr ? "Prénom" : "First name"}>
                    <input
                      className={inputCls}
                      value={form.firstName}
                      onChange={(e) => setField("firstName", e.target.value)}
                      placeholder={fr ? "Marie" : "Marie"}
                      autoComplete="given-name"
                    />
                  </Field>
                  <Field label={fr ? "Nom" : "Last name"}>
                    <input
                      className={inputCls}
                      value={form.lastName}
                      onChange={(e) => setField("lastName", e.target.value)}
                      placeholder={fr ? "Tremblay" : "Tremblay"}
                      autoComplete="family-name"
                    />
                  </Field>
                </div>

                <Field label={fr ? "Courriel" : "Email"}>
                  <input
                    className={inputCls}
                    type="email"
                    value={form.email}
                    onChange={(e) => setField("email", e.target.value)}
                    placeholder="marie@exemple.com"
                    autoComplete="email"
                  />
                </Field>

                <Field label={fr ? "Téléphone (optionnel)" : "Phone (optional)"}>
                  <input
                    className={inputCls}
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setField("phone", e.target.value)}
                    placeholder="514-000-0000"
                    autoComplete="tel"
                  />
                </Field>

                <Field label={fr ? "Rôle" : "Role"}>
                  <div className="flex gap-3">
                    {["lead", "follow", "versatile"].map((r) => (
                      <RoleButton key={r} value={r} selected={form.role === r} onClick={() => setField("role", r)}>
                        {r === "lead" ? "Lead" : r === "follow" ? "Follow" : "Versatile"}
                      </RoleButton>
                    ))}
                  </div>
                </Field>

                {referralSources.length > 0 && (
                  <Field label={fr ? "Comment avez-vous entendu parler de nous ?" : "How did you hear about us?"}>
                    <div className="flex flex-wrap gap-2">
                      {referralSources.map((src) => {
                        const checked = selectedReferralSources.includes(src.idreferral_sources);
                        return (
                          <button
                            key={src.idreferral_sources}
                            type="button"
                            onClick={() =>
                              setSelectedReferralSources((prev) =>
                                checked
                                  ? prev.filter((id) => id !== src.idreferral_sources)
                                  : [...prev, src.idreferral_sources]
                              )
                            }
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                              checked
                                ? "bg-amber-400 border-amber-400 text-amber-900"
                                : "bg-white/10 border-white/15 text-white/60 hover:bg-white/20"
                            }`}
                          >
                            {fr ? src.name_fr : src.name_en}
                          </button>
                        );
                      })}
                    </div>
                  </Field>
                )}

                <div className="mt-6 flex justify-between">
                  <button onClick={() => setStep("projects")} className="px-6 py-3 rounded-2xl text-white/60 hover:text-white transition">
                    ← {fr ? "Retour" : "Back"}
                  </button>
                  <button
                    onClick={() => setStep("review")}
                    disabled={!canGoToReview}
                    className={`px-8 py-3.5 rounded-2xl font-bold text-base transition-all ${
                      canGoToReview
                        ? "bg-amber-400 text-amber-900 hover:bg-amber-300 shadow-lg shadow-amber-400/20"
                        : "bg-white/10 text-white/30 cursor-not-allowed"
                    }`}
                  >
                    {fr ? "Réviser →" : "Review →"}
                  </button>
                </div>
              </div>
            )}

            {/* ── Step: review ── */}
            {step === "review" && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">
                  {fr ? "Confirmer l'inscription" : "Confirm registration"}
                </h2>

                {/* Person summary */}
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 mb-4">
                  <p className="text-xs uppercase tracking-wide text-white/50 mb-2 font-semibold">{fr ? "Participant·e" : "Participant"}</p>
                  <p className="text-white font-semibold text-lg">{form.firstName} {form.lastName}</p>
                  <p className="text-white/60 text-sm">{form.email}</p>
                  {form.phone && <p className="text-white/60 text-sm">{form.phone}</p>}
                  <p className="text-white/60 text-sm capitalize mt-1">{fr ? "Rôle" : "Role"}: {form.role}</p>
                </div>

                {/* Projects summary */}
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 mb-4">
                  <p className="text-xs uppercase tracking-wide text-white/50 mb-3 font-semibold">{fr ? "Projets sélectionnés" : "Selected projects"}</p>
                  {isBundle && (
                    <div className="mb-3 px-3 py-2 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-bold uppercase tracking-wide">
                      🎉 {fr ? "Offre 2 pour 1 — tarif réduit appliqué" : "2-for-1 deal — reduced rate applied"}
                    </div>
                  )}
                  <div className="divide-y divide-white/10">
                    {selected.map((t) => {
                      const price = isBundle ? Number(t.price) / 2 : Number(t.price);
                      return (
                        <div key={t.idtroupes} className="py-3 flex justify-between items-center">
                          <div>
                            <p className="text-white font-semibold">{fr ? t.name_fr : t.name_en}</p>
                            <p className="text-white/50 text-xs">
                              {dayOfWeek(t.start_date, lang)} · {fmtTime(t.time)}
                            </p>
                          </div>
                          <div className="text-right">
                            {isBundle && (
                              <p className="text-xs text-white/30 line-through">${Number(t.price).toFixed(2)}</p>
                            )}
                            <p className="text-white font-bold">${price.toFixed(2)}<span className="text-white/40 font-normal text-xs">/mois</span></p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="pt-3 border-t border-white/10 flex justify-between items-center">
                    <p className="text-white/60 text-sm font-semibold">{fr ? "Total mensuel" : "Monthly total"}</p>
                    <p className="text-amber-400 font-extrabold text-xl">${totalPrice.toFixed(2)}</p>
                  </div>
                </div>

                <p className="text-white/40 text-xs mb-6 leading-relaxed">
                  {fr
                    ? "Les frais sont facturés mensuellement. Vous recevrez vos factures par courriel. En vous inscrivant, vous acceptez les conditions d'utilisation de Swing ConneXion."
                    : "Fees are billed monthly. You will receive your invoices by email. By registering, you agree to Swing ConneXion's terms."}
                </p>

                {error && (
                  <div className="mb-4 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
                    {error}
                  </div>
                )}

                <div className="flex justify-between">
                  <button onClick={() => setStep("info")} className="px-6 py-3 rounded-2xl text-white/60 hover:text-white transition">
                    ← {fr ? "Retour" : "Back"}
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="px-8 py-3.5 rounded-2xl font-bold text-base bg-amber-400 text-amber-900 hover:bg-amber-300 shadow-lg shadow-amber-400/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {submitting
                      ? (fr ? "Inscription en cours…" : "Registering…")
                      : (fr ? "Confirmer l'inscription ✓" : "Confirm registration ✓")}
                  </button>
                </div>
              </div>
            )}

            {/* ── Step: done ── */}
            {step === "done" && (
              <div className="text-center py-8">
                <div className="relative inline-block mb-6">
                  <SunSVG className="w-24 h-24 text-amber-400 mx-auto" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl">✓</span>
                  </div>
                </div>
                <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-3">
                  {fr ? "Bienvenue !" : "Welcome!"}
                </h2>
                <p className="text-white/70 text-base md:text-lg max-w-md mx-auto mb-4">
                  {fr
                    ? `Merci ${form.firstName} ! Votre inscription est confirmée. Un courriel de confirmation vous a été envoyé.`
                    : `Thanks ${form.firstName}! Your registration is confirmed. A confirmation email has been sent to you.`}
                </p>
                {isBundle && (
                  <div className="inline-block px-5 py-2.5 rounded-2xl bg-amber-400/15 border border-amber-400/30 text-amber-300 text-sm font-semibold mb-6">
                    🎉 {fr ? "Offre 2 pour 1 appliquée — belle décision !" : "2-for-1 deal applied — great choice!"}
                  </div>
                )}
                <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5 max-w-sm mx-auto text-left">
                  <p className="text-xs uppercase tracking-wide text-white/50 mb-3 font-semibold">{fr ? "Prochaines étapes" : "Next steps"}</p>
                  <ul className="space-y-2 text-sm text-white/70">
                    <li>📧 {fr ? "Vérifiez votre courriel pour la confirmation" : "Check your email for confirmation"}</li>
                    <li>🎵 {fr ? "Nous vous contacterons avec les détails" : "We'll reach out with details"}</li>
                    <li>💳 {fr ? "Vos factures arriveront mensuellement" : "Your invoices will arrive monthly"}</li>
                  </ul>
                </div>
              </div>
            )}

          </div>
        </Container>
      </div>

      <Footer />
    </div>
  );
}
