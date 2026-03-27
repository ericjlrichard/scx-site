import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useI18n } from "../i18n/useI18n";
import PageHero from "../components/PageHero";
import Footer from "../components/Footer";
import Container from "../components/Container";
import Button from "../components/Button";
import Spinner from "../components/Spinner";

const API = "https://api.swingconnexion.com/public";
const REBATE_AMOUNT = 40;
const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

const COOKIE_NAME = "dome_signup";
const COOKIE_DOMAIN = ".swingconnexion.com";

function setDomeCookie(token) {
  const maxAge = 30 * 24 * 60 * 60;
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(token)}; domain=${COOKIE_DOMAIN}; max-age=${maxAge}; secure; samesite=lax; path=/`;
}
function getDomeCookie() {
  const match = document.cookie.match(/(?:^|; )dome_signup=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}
function clearDomeCookie() {
  document.cookie = `${COOKIE_NAME}=; domain=${COOKIE_DOMAIN}; max-age=0; path=/`;
}

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
    if (!window.grecaptcha) return reject(new Error("reCAPTCHA not loaded"));
    window.grecaptcha.ready(() => {
      window.grecaptcha
        .execute(RECAPTCHA_SITE_KEY, { action: "signup" })
        .then(resolve)
        .catch(reject);
    });
  });
}

const STEPS = ["info", "classes", "review"];

function StepIndicator({ step }) {
  const labels = { info: "Your Info", classes: "Classes", review: "Review" };
  return (
    <div className="flex items-center justify-center gap-0 mb-10">
      {STEPS.map((s, i) => {
        const current = s === step;
        const done = STEPS.indexOf(step) > i;
        return (
          <div key={s} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  done
                    ? "bg-[var(--color-scx-primary)] text-white"
                    : current
                    ? "bg-white text-[var(--color-scx-secondary)]"
                    : "bg-white/20 text-white/50"
                }`}
              >
                {done ? "✓" : i + 1}
              </div>
              <span
                className={`mt-1.5 text-[11px] uppercase tracking-wide font-semibold ${
                  current ? "text-white" : done ? "text-white/70" : "text-white/40"
                }`}
              >
                {labels[s]}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`w-16 h-px mx-2 mb-5 transition-colors ${
                  done ? "bg-[var(--color-scx-primary)]" : "bg-white/20"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function RoleButton({ value, selected, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 py-3 rounded-2xl font-semibold text-sm transition-colors border ${
        selected
          ? "bg-[var(--color-scx-primary)] border-[var(--color-scx-primary)] text-white"
          : "bg-white/10 border-white/20 text-white/70 hover:bg-white/20"
      }`}
    >
      {children}
    </button>
  );
}

const DESC_LIMIT = 100;

function getWeekDates(cls) {
  if (!cls.date || !cls.duration_weeks) return [];
  const today = new Date().toISOString().slice(0, 10);
  const dates = [];
  const start = new Date(cls.date + "T12:00:00");
  for (let i = 0; i < cls.duration_weeks; i++) {
    const d = new Date(start.getTime() + i * 7 * 86400000);
    const dateStr = d.toISOString().slice(0, 10);
    if (dateStr >= today) dates.push(dateStr);
  }
  return dates;
}

function ClassCard({ cls, selected, onToggle, lang, dropinWeeks = [], onDropinToggle }) {
  const [descExpanded, setDescExpanded] = useState(false);
  const name = cls.name?.[lang] || cls.name?.fr || "";
  const desc = cls.desc?.[lang] || cls.desc?.fr || "";
  const teachers = Array.isArray(cls.teachers)
    ? cls.teachers.map((t) => t.first_name).join(", ")
    : "";
  const descTruncated = desc.length > DESC_LIMIT && !descExpanded
    ? desc.slice(0, DESC_LIMIT).trimEnd() + "…"
    : desc;

  const dayStr = cls.date
    ? new Date(cls.date + "T12:00:00").toLocaleDateString(
        lang === "en" ? "en-CA" : "fr-CA",
        { weekday: "long", month: "long", day: "numeric" }
      )
    : "";

  const price = Number(cls.price) || 0;
  const rebate = Number(cls.rebate) || 0;
  const finalPrice = Math.max(0, price - rebate);
  const dropinPrice = Number(cls.dropin_price) || 0;
  const isDropin = !!cls.is_dropin;
  const weekDates = isDropin ? getWeekDates(cls) : [];
  const isActive = selected || dropinWeeks.length > 0;

  const cardBody = (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${
              isActive
                ? "border-[var(--color-scx-primary)] bg-[var(--color-scx-primary)]"
                : "border-white/40"
            }`}
          >
            {isActive && <span className="text-white text-xs">✓</span>}
          </span>
          <h3 className="font-bold text-white text-[15px]">{name}</h3>
        </div>
        {desc && (
          <p className="mt-1 ml-7 text-sm text-white/65 leading-snug">
            {descTruncated}
            {desc.length > DESC_LIMIT && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setDescExpanded((v) => !v); }}
                className="ml-1 text-white/40 hover:text-white/70 text-xs"
              >
                {descExpanded ? "▲" : "▼"}
              </button>
            )}
          </p>
        )}
        <div className="mt-2 ml-7 flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/60">
          {dayStr && <span>📅 {dayStr}</span>}
          {cls.time && <span>🕐 {cls.time.slice(0, 5)}</span>}
          {teachers && <span>👤 {teachers}</span>}
          {cls.duration_weeks && <span>📆 {cls.duration_weeks} weeks</span>}
        </div>
      </div>
      <div className="flex-shrink-0 text-right">
        {rebate > 0 && (
          <div className="text-sm text-white/40 line-through">${price.toFixed(2)}</div>
        )}
        <span className="font-bold text-white text-lg">
          ${finalPrice.toFixed(2)}
        </span>
        <div className="text-xs text-white/50">CAD</div>
      </div>
    </div>
  );

  if (!isDropin) {
    return (
      <button
        type="button"
        onClick={onToggle}
        className={`w-full text-left rounded-2xl border px-5 py-4 transition-all ${
          selected
            ? "border-[var(--color-scx-primary)] bg-[var(--color-scx-primary)]/15 ring-1 ring-[var(--color-scx-primary)]"
            : "border-white/15 bg-white/5 hover:bg-white/10"
        }`}
      >
        {cardBody}
      </button>
    );
  }

  // Drop-in enabled: show full-class + per-week options
  return (
    <div className={`rounded-2xl border px-5 py-4 transition-all ${
      isActive
        ? "border-[var(--color-scx-primary)] bg-[var(--color-scx-primary)]/15 ring-1 ring-[var(--color-scx-primary)]"
        : "border-white/15 bg-white/5"
    }`}>
      {cardBody}

      <div className="mt-4 ml-7 space-y-2">
        {/* Full class option */}
        <button
          type="button"
          onClick={onToggle}
          className={`w-full flex items-center justify-between rounded-xl px-4 py-2.5 text-sm transition-all ${
            selected
              ? "bg-[var(--color-scx-primary)]/30 border border-[var(--color-scx-primary)]"
              : "bg-white/5 border border-white/10 hover:bg-white/10"
          }`}
        >
          <span className="font-medium">
            {lang === "fr" ? "Cours complet" : "Full class"} ({cls.duration_weeks} {lang === "fr" ? "semaines" : "weeks"})
          </span>
          <span className="font-bold">${finalPrice.toFixed(2)}</span>
        </button>

        {/* Drop-in option */}
        <div className={`rounded-xl border px-4 py-2.5 transition-all ${
          dropinWeeks.length > 0
            ? "bg-[var(--color-scx-primary)]/30 border-[var(--color-scx-primary)]"
            : "bg-white/5 border-white/10"
        }`}>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="font-medium">{lang === "fr" ? "À la carte" : "Drop-in"}</span>
            <span className="text-white/60">${dropinPrice.toFixed(2)} / {lang === "fr" ? "sem." : "week"}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {weekDates.map((date) => {
              const checked = dropinWeeks.includes(date);
              const label = new Date(date + "T12:00:00").toLocaleDateString(
                lang === "fr" ? "fr-CA" : "en-CA",
                { month: "short", day: "numeric" }
              );
              return (
                <button
                  key={date}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onDropinToggle(date); }}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    checked
                      ? "bg-[var(--color-scx-primary)] text-white"
                      : "bg-white/10 text-white/60 hover:bg-white/20"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
          {dropinWeeks.length > 0 && (
            <div className="mt-2 text-xs text-white/50 text-right">
              {dropinWeeks.length} × ${dropinPrice.toFixed(2)} = <strong className="text-white">${(dropinWeeks.length * dropinPrice).toFixed(2)}</strong>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SignUp() {
  const { lang } = useParams();
  const [searchParams] = useSearchParams();
  const { t } = useI18n();
  const locale = (lang || "fr").startsWith("en") ? "en" : "fr";

  const [step, setStep] = useState("info");
  const [loadTime] = useState(() => Date.now());

  // Load reCAPTCHA on mount
  useEffect(() => { loadRecaptcha(); }, []);

  // Dome login state
  const [domeUser, setDomeUser] = useState(null);       // user info if logged in via Dome
  const [domeToken, setDomeToken] = useState(null);     // token to pass with submission
  const [loginMode, setLoginMode] = useState("new");    // "new" | "dome"
  const [domeEmail, setDomeEmail] = useState("");
  const [domePassword, setDomePassword] = useState("");
  const [domeLoading, setDomeLoading] = useState(false);
  const [domeError, setDomeError] = useState(null);

  // Auto-login: check URL token first, then fall back to cookie
  useEffect(() => {
    const urlToken = searchParams.get("domeToken") || getDomeCookie();
    if (!urlToken) return;
    fetch(`${API}/dome-crossauth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: urlToken }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.ok && data.user) applyDomeUser(data.user, urlToken);
        else clearDomeCookie(); // expired or invalid — wipe it silently
      })
      .catch(() => {});
  }, []);

  function applyDomeUser(user, token) {
    setDomeUser(user);
    setDomeToken(token);
    setLoginMode("dome");
    setForm({
      firstName: user.first_name || "",
      lastName:  user.last_name  || "",
      email:     user.email      || "",
      phone:     user.phone_number || "",
      role:      "",
    });
    setDomeCookie(token);
  }

  async function handleDomeLogin() {
    setDomeLoading(true);
    setDomeError(null);
    try {
      const res = await fetch(`${API}/dome-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: domeEmail, password: domePassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed.");
      applyDomeUser(data.user, data.token);
    } catch (err) {
      setDomeError(err.message);
    } finally {
      setDomeLoading(false);
    }
  }

  // Step 1: contact info
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "",
  });

  // Step 2: class selection
  const [classes, setClasses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [classError, setClassError] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [dropinSelections, setDropinSelections] = useState({}); // { [classId]: string[] }

  // Step 3: review
  const [studentRebate, setStudentRebate] = useState(false);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  const [squareLoading, setSquareLoading] = useState(false);
  const [squareError, setSquareError] = useState(null);

  // Mercredis Swing mode
  const [mercredisSwing, setMercredisSwing] = useState(false);
  useEffect(() => {
    fetch(`${API}/mercredi-swing`).then((r) => r.json()).then((d) => setMercredisSwing(!!d.active)).catch(() => {});
  }, []);

  // Promo codes (multiple can stack)
  const [promoInput, setPromoInput] = useState("");
  const [appliedPromos, setAppliedPromos] = useState([]);
  const [promoError, setPromoError] = useState(null);
  const [promoLoading, setPromoLoading] = useState(false);

  // Validation errors
  const [errors, setErrors] = useState({});

  // Fetch classes when entering step 2
  useEffect(() => {
    if (step !== "classes" || classes.length > 0) return;
    setLoadingClasses(true);
    fetch(`${API}/classes`)
      .then((r) => r.json())
      .then((data) => {
        // Only show upcoming / current classes
        const today = new Date().toISOString().slice(0, 10);
        const filtered = data.filter((c) => {
            if (!c.date) return true;
            const lastDate = c.duration_weeks
              ? new Date(
                  new Date(c.date + "T12:00:00").getTime() +
                    (c.duration_weeks - 1) * 7 * 86400000
                )
                  .toISOString()
                  .slice(0, 10)
              : c.date;
            return lastDate >= today;
          });
        filtered.sort((a, b) => {
          const aSwing1 = (a.name?.fr || a.name?.en || "").startsWith("Swing 1");
          const bSwing1 = (b.name?.fr || b.name?.en || "").startsWith("Swing 1");
          if (aSwing1 && !bSwing1) return -1;
          if (!aSwing1 && bSwing1) return 1;
          return 0;
        });
        setClasses(filtered);
        const preselect = searchParams.get("class");
        if (preselect) {
          const id = Number(preselect);
          if (filtered.some((c) => c.id === id)) {
            setSelectedIds((prev) => new Set([...prev, id]));
          }
        }
      })
      .catch(() => setClassError("Failed to load classes. Please refresh."))
      .finally(() => setLoadingClasses(false));
  }, [step]);

  // Computed totals
  const selectedClasses = classes.filter((c) => selectedIds.has(c.id));

  function getMercredisDiscount(cls) {
    if (!mercredisSwing) return 0;
    const name = cls.name?.fr || cls.name?.en || "";
    if (!name.includes("Swing 1")) return 0;
    return Math.min(20, Number(cls.price) || 0);
  }

  function getPromoDiscount(cls) {
    if (!appliedPromos.length) return 0;
    const base = Number(cls.price) || 0;
    const total = appliedPromos
      .filter((p) => p.applicable_class_ids.includes(cls.id))
      .reduce((sum, p) => {
        const d = p.discount_type === "percent"
          ? parseFloat((base * p.discount_value / 100).toFixed(2))
          : p.discount_value;
        return sum + d;
      }, 0);
    return Math.min(total, base);
  }

  const dropinTotal = Object.entries(dropinSelections).reduce((sum, [id, weeks]) => {
    const cls = classes.find((c) => c.id === Number(id));
    return sum + (Number(cls?.dropin_price) || 0) * weeks.length;
  }, 0);

  const total = selectedClasses.reduce((sum, c) => {
    const price = Number(c.price) || 0;
    const classRebate = Number(c.rebate) || 0;
    const studentRebateAmt = studentRebate ? Math.min(REBATE_AMOUNT, price) : 0;
    const promo = getPromoDiscount(c);
    const mercredi = getMercredisDiscount(c);
    return sum + Math.max(0, price - classRebate - studentRebateAmt - promo - mercredi);
  }, 0) + dropinTotal;

  function setField(key, val) {
    setForm((p) => ({ ...p, [key]: val }));
    if (errors[key]) setErrors((p) => ({ ...p, [key]: null }));
  }

  function validateInfo() {
    const e = {};
    if (!form.firstName.trim()) e.firstName = locale === "fr" ? "Requis" : "Required";
    if (!form.lastName.trim()) e.lastName = locale === "fr" ? "Requis" : "Required";
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = locale === "fr" ? "Courriel invalide" : "Invalid email";
    if (!form.role) e.role = locale === "fr" ? "Veuillez choisir un rôle" : "Please choose a role";
    return e;
  }

  function goToClasses() {
    const e = validateInfo();
    if (Object.keys(e).length) { setErrors(e); return; }
    setStep("classes");
  }

  function goToReview() {
    const hasDropins = Object.values(dropinSelections).some((w) => w.length > 0);
    if (selectedIds.size === 0 && !hasDropins) {
      setClassError(locale === "fr" ? "Veuillez sélectionner au moins un cours." : "Please select at least one class.");
      return;
    }
    setClassError(null);
    setStep("review");
  }

  async function handleApplyPromo() {
    const code = promoInput.trim().toUpperCase();
    if (!code) return;
    if (appliedPromos.some((p) => p.code === code)) {
      setPromoError(locale === "fr" ? "Ce code est déjà appliqué." : "This code is already applied.");
      return;
    }
    setPromoLoading(true);
    setPromoError(null);
    try {
      const res = await fetch(`${API}/validate-promo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, classIds: Array.from(selectedIds) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAppliedPromos((prev) => [...prev, { ...data, code }]);
      setPromoInput("");
    } catch (err) {
      setPromoError(err.message);
    } finally {
      setPromoLoading(false);
    }
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const recaptchaToken = await getRecaptchaToken();
      const res = await fetch(`${API}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          honeypot: "",
          elapsedMs: Date.now() - loadTime,
          recaptchaToken,
          domeToken: domeToken || null,
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
          role: form.role,
          classIds: Array.from(selectedIds),
          dropinSelections: Object.fromEntries(
            Object.entries(dropinSelections).filter(([, w]) => w.length > 0)
          ),
          studentRebate,
          note,
          promoCodes: appliedPromos.map((p) => p.code),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed.");
      setSubmitResult(data);
      setSubmitted(true);
    } catch (err) {
      setErrors({ submit: err.message });
    } finally {
      setSubmitting(false);
    }
  }

  async function goToSquare(result) {
    setSquareLoading(true);
    setSquareError(null);
    try {
      const paidTotal = result.created.reduce((sum, r) => sum + (r.price || 0), 0);
      const amountCents = Math.round(paidTotal * 100);
      const referenceId = result.created.map((r) => r.invNumber || r.idinvoices).join(",");
      const redirectUrl = `${window.location.origin}/${locale}/payment-thanks?ref=${encodeURIComponent(referenceId)}`;
      const resp = await fetch(`${API}/square-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountCents, referenceId, redirectUrl }),
      });
      const data = await resp.json();
      if (data.ok && data.url) {
        window.location.href = data.url;
      } else {
        setSquareError(locale === "fr" ? "Impossible de créer le lien de paiement." : "Could not create payment link.");
        setSquareLoading(false);
      }
    } catch {
      setSquareError(locale === "fr" ? "Erreur de connexion au système de paiement." : "Payment system connection error.");
      setSquareLoading(false);
    }
  }

  const roleLabels = {
    lead: locale === "fr" ? "Lead" : "Lead",
    follow: locale === "fr" ? "Follow" : "Follow",
    versatile: locale === "fr" ? "Versatile" : "Versatile",
  };

  if (submitted) {
    return (
      <>
        <PageHero
          className="-mt-25"
          imageSrc="/images/katya_zack.jpg"
          imageAlt="SCX dancers"
          bandColorVar="var(--color-scx-secondary)"
          titleLines={locale === "fr" ? ["INSCRIPTION"] : ["REGISTRATION"]}
        />
        <section className="bg-scx-secondary text-white">
          <Container>
            <div className="py-16 max-w-xl mx-auto">
              <div className="text-center mb-8">
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-2xl font-bold mb-2">
                  {locale === "fr" ? "Inscription reçue !" : "Registration received!"}
                </h2>
                <p className="text-white/70">
                  {locale === "fr"
                    ? `Merci ${form.firstName} ! Vous recevrez une confirmation par courriel.`
                    : `Thanks ${form.firstName}! You'll receive a confirmation by email.`}
                </p>
              </div>

              {/* Created registrations */}
              {submitResult?.created?.length > 0 && (
                <div className="rounded-2xl bg-white/5 border border-white/10 px-5 py-4 mb-4">
                  <h3 className="text-xs uppercase tracking-wide text-white/50 font-semibold mb-3">
                    {locale === "fr" ? "Inscriptions créées" : "Registrations created"}
                  </h3>
                  <div className="space-y-2">
                    {submitResult.created.map((r) => {
                      const cls = classes.find((c) => c.id === r.idclasses);
                      const name = cls?.name?.[locale] || cls?.name?.fr || `Class #${r.idclasses}`;
                      return (
                        <div key={r.idregistrations} className="flex items-center justify-between text-sm">
                          <span className="text-white">{name}</span>
                          <span className="text-green-400 text-xs font-semibold">
                            {locale === "fr" ? "✓ Confirmé" : "✓ Confirmed"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Skipped (already registered) */}
              {submitResult?.skipped?.length > 0 && (
                <div className="rounded-2xl bg-yellow-900/30 border border-yellow-500/20 px-5 py-4 mb-4">
                  <h3 className="text-xs uppercase tracking-wide text-yellow-400/70 font-semibold mb-2">
                    {locale === "fr" ? "Déjà inscrit·e" : "Already registered"}
                  </h3>
                  <div className="space-y-1">
                    {submitResult.skipped.map((r) => {
                      const cls = classes.find((c) => c.id === r.idclasses);
                      const name = cls?.name?.[locale] || cls?.name?.fr || `Class #${r.idclasses}`;
                      return (
                        <p key={r.idclasses} className="text-sm text-yellow-200/70">{name}</p>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Square payment option */}
              {submitResult?.created?.length > 0 &&
                submitResult.created.reduce((sum, r) => sum + (r.price || 0), 0) > 0 && (
                <div className="mt-6 rounded-2xl bg-white/5 border border-white/10 px-5 py-5 text-center">
                  <p className="text-sm text-white/70 mb-4">
                    {locale === "fr"
                      ? "Vous pouvez payer immédiatement par carte de crédit via Square :"
                      : "You can pay right now by credit card via Square:"}
                  </p>
                  {squareError && <p className="text-red-400 text-xs mb-3">{squareError}</p>}
                  <Button
                    bgVar="var(--color-scx-primary)"
                    fgVar="#fff"
                    className="w-full justify-center"
                    onClick={() => goToSquare(submitResult)}
                    disabled={squareLoading}
                  >
                    {squareLoading ? (
                      <span className="inline-flex items-center gap-2">
                        <Spinner size={14} />
                        {locale === "fr" ? "Redirection…" : "Redirecting…"}
                      </span>
                    ) : (
                      locale === "fr" ? "Payer par carte (Square) →" : "Pay by card (Square) →"
                    )}
                  </Button>
                  <p className="text-xs text-white/40 mt-3">
                    {locale === "fr"
                      ? "Des frais de traitement peuvent s'appliquer."
                      : "Processing fees may apply."}
                  </p>
                </div>
              )}

              <div className="text-center mt-4">
                <a
                  href="https://dome.swingconnexion.com/my-invoices"
                  className="text-sm text-[var(--color-scx-primary)] hover:underline"
                >
                  {locale === "fr" ? "Voir mes factures sur Dome →" : "View my invoices on Dome →"}
                </a>
              </div>
            </div>
          </Container>
        </section>
        <Footer />
      </>
    );
  }

  return (
    <>
      <title>Sign Up — Swing ConneXion</title>
      <meta name="robots" content="noindex,nofollow" />
      <PageHero
        className="-mt-25"
        imageSrc="/images/katya_zack.jpg"
        imageAlt="SCX dancers"
        bandColorVar="var(--color-scx-secondary)"
        titleLines={locale === "fr" ? ["INSCRIPTION"] : ["REGISTRATION"]}
        description={
          locale === "fr"
            ? "Bienvenue, ou bienvenue à nouveau chez SCX !"
            : "Welcome, or welcome back to SCX!"
        }
      />

      <section className="bg-scx-secondary text-white">
        <Container>
          <div className="py-10 max-w-xl mx-auto">
            <StepIndicator step={step} />

            {mercredisSwing && (
              <div className="mb-6 rounded-2xl border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-sm text-amber-300 text-center font-medium">
                🎉 {locale === "fr"
                  ? "Soirée Mercredis Swing — $20 de rabais sur les cours Swing 1 !"
                  : "Mercredis Swing Night — $20 off Swing 1 classes!"}
              </div>
            )}

            {/* ── Step 1: Your Info ── */}
            {step === "info" && (
              <div className="space-y-4">

                {/* Dome login banner if auto-logged in from URL */}
                {domeUser && (
                  <div className="flex items-center gap-3 rounded-2xl bg-green-900/40 border border-green-500/30 px-4 py-3">
                    <span className="text-green-400 text-lg">✓</span>
                    <div className="flex-1 text-sm">
                      <span className="text-green-300 font-semibold">
                        {locale === "fr" ? "Connecté via Dome" : "Logged in via Dome"}
                      </span>
                      <span className="text-white/60 ml-2">
                        {domeUser.first_name} {domeUser.last_name}
                      </span>
                    </div>
                    <button
                      onClick={() => { setDomeUser(null); setDomeToken(null); setLoginMode("new"); setForm({ firstName: "", lastName: "", email: "", phone: "", role: "" }); }}
                      className="text-xs text-white/40 hover:text-white/70"
                    >
                      {locale === "fr" ? "Changer" : "Switch"}
                    </button>
                  </div>
                )}

                {/* Toggle: New / Dome account — only show if not already logged in */}
                {!domeUser && (
                  <div className="flex rounded-2xl overflow-hidden border border-white/15">
                    {[["new", locale === "fr" ? "Nouveau·elle" : "New here"], ["dome", locale === "fr" ? "J'ai un compte Dome" : "I have a Dome account"]].map(([mode, label]) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => { setLoginMode(mode); setDomeError(null); }}
                        className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${loginMode === mode ? "bg-white/15 text-white" : "text-white/45 hover:text-white/70"}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Dome login form */}
                {!domeUser && loginMode === "dome" && (
                  <div className="space-y-3 rounded-2xl bg-white/5 border border-white/10 px-4 py-4">
                    <div>
                      <label className="block text-[11px] uppercase tracking-wide text-white/70 mb-1.5">Email</label>
                      <input
                        type="email"
                        value={domeEmail}
                        onChange={(e) => setDomeEmail(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleDomeLogin()}
                        className="w-full rounded-2xl bg-white/10 border border-white/15 px-4 py-3 text-white placeholder-white/40 outline-none focus:ring-2 focus:ring-white/30"
                        placeholder="you@example.com"
                        autoComplete="email"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] uppercase tracking-wide text-white/70 mb-1.5">
                        {locale === "fr" ? "Mot de passe" : "Password"}
                      </label>
                      <input
                        type="password"
                        value={domePassword}
                        onChange={(e) => setDomePassword(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleDomeLogin()}
                        className="w-full rounded-2xl bg-white/10 border border-white/15 px-4 py-3 text-white placeholder-white/40 outline-none focus:ring-2 focus:ring-white/30"
                        placeholder="••••••••"
                        autoComplete="current-password"
                      />
                    </div>
                    {domeError && <p className="text-red-400 text-xs">{domeError}</p>}
                    <Button
                      bgVar="var(--color-scx-primary)"
                      fgVar="#fff"
                      className="w-full"
                      onClick={handleDomeLogin}
                      disabled={domeLoading}
                    >
                      {domeLoading
                        ? <span className="inline-flex items-center gap-2"><Spinner size={14} />{locale === "fr" ? "Connexion…" : "Signing in…"}</span>
                        : locale === "fr" ? "Se connecter" : "Sign in"
                      }
                    </Button>
                  </div>
                )}

                {/* Contact fields — shown for "new" mode, or when logged in via Dome (prefilled + editable) */}
                {(loginMode === "new" || domeUser) && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] uppercase tracking-wide text-white/70 mb-1.5">
                          {locale === "fr" ? "Prénom" : "First name"} *
                        </label>
                        <input
                          value={form.firstName}
                          onChange={(e) => setField("firstName", e.target.value)}
                          className={`w-full rounded-2xl bg-white/10 border px-4 py-3 text-white placeholder-white/40 outline-none focus:ring-2 focus:ring-white/30 ${errors.firstName ? "border-red-400" : "border-white/15"}`}
                          placeholder={locale === "fr" ? "Prénom" : "First name"}
                        />
                        {errors.firstName && <p className="mt-1 text-xs text-red-400">{errors.firstName}</p>}
                      </div>
                      <div>
                        <label className="block text-[11px] uppercase tracking-wide text-white/70 mb-1.5">
                          {locale === "fr" ? "Nom" : "Last name"} *
                        </label>
                        <input
                          value={form.lastName}
                          onChange={(e) => setField("lastName", e.target.value)}
                          className={`w-full rounded-2xl bg-white/10 border px-4 py-3 text-white placeholder-white/40 outline-none focus:ring-2 focus:ring-white/30 ${errors.lastName ? "border-red-400" : "border-white/15"}`}
                          placeholder={locale === "fr" ? "Nom" : "Last name"}
                        />
                        {errors.lastName && <p className="mt-1 text-xs text-red-400">{errors.lastName}</p>}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] uppercase tracking-wide text-white/70 mb-1.5">Email *</label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => setField("email", e.target.value)}
                        className={`w-full rounded-2xl bg-white/10 border px-4 py-3 text-white placeholder-white/40 outline-none focus:ring-2 focus:ring-white/30 ${errors.email ? "border-red-400" : "border-white/15"}`}
                        placeholder="you@example.com"
                      />
                      {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
                    </div>

                    <div>
                      <label className="block text-[11px] uppercase tracking-wide text-white/70 mb-1.5">
                        {locale === "fr" ? "Téléphone" : "Phone"}
                      </label>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => setField("phone", e.target.value)}
                        className="w-full rounded-2xl bg-white/10 border border-white/15 px-4 py-3 text-white placeholder-white/40 outline-none focus:ring-2 focus:ring-white/30"
                        placeholder="514-555-0100"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] uppercase tracking-wide text-white/70 mb-2">
                        {locale === "fr" ? "Rôle" : "Role"} *
                      </label>
                      <div className="flex gap-3">
                        {["lead", "follow", "versatile"].map((r) => (
                          <RoleButton key={r} value={r} selected={form.role === r} onClick={() => setField("role", r)}>
                            {roleLabels[r]}
                          </RoleButton>
                        ))}
                      </div>
                      {errors.role && <p className="mt-1.5 text-xs text-red-400">{errors.role}</p>}
                    </div>

                    <div className="pt-2">
                      <Button bgVar="var(--color-scx-primary)" fgVar="#fff" className="w-full justify-center" onClick={goToClasses}>
                        {locale === "fr" ? "Choisir mes cours →" : "Choose classes →"}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── Step 2: Choose Classes ── */}
            {step === "classes" && (
              <div>
                <p className="text-white/70 text-sm mb-5">
                  {locale === "fr"
                    ? "Sélectionnez un ou plusieurs cours."
                    : "Select one or more classes."}
                </p>

                {loadingClasses && (
                  <div className="flex justify-center py-12">
                    <Spinner size={32} />
                  </div>
                )}

                {!loadingClasses && classes.length === 0 && !classError && (
                  <p className="text-white/50 text-sm text-center py-8">
                    {locale === "fr"
                      ? "Aucun cours disponible pour le moment."
                      : "No classes available at the moment."}
                  </p>
                )}

                {classError && (
                  <p className="text-red-400 text-sm mb-4">{classError}</p>
                )}

                <div className="space-y-3">
                  {classes.map((cls) => (
                    <ClassCard
                      key={cls.id}
                      cls={cls}
                      selected={selectedIds.has(cls.id)}
                      dropinWeeks={dropinSelections[cls.id] || []}
                      lang={locale}
                      onToggle={() => {
                        // clear drop-in weeks for this class when selecting full
                        setDropinSelections((prev) => { const n = { ...prev }; delete n[cls.id]; return n; });
                        setSelectedIds((prev) => {
                          const next = new Set(prev);
                          next.has(cls.id) ? next.delete(cls.id) : next.add(cls.id);
                          return next;
                        });
                        setClassError(null);
                      }}
                      onDropinToggle={(date) => {
                        // clear full selection when picking drop-in weeks
                        setSelectedIds((prev) => { const n = new Set(prev); n.delete(cls.id); return n; });
                        setDropinSelections((prev) => {
                          const weeks = prev[cls.id] || [];
                          const next = weeks.includes(date)
                            ? weeks.filter((d) => d !== date)
                            : [...weeks, date];
                          return { ...prev, [cls.id]: next };
                        });
                        setClassError(null);
                      }}
                    />
                  ))}
                </div>

                <div className="flex gap-3 mt-6">
                  <Button
                    bgVar="transparent"
                    fgVar="#fff"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setStep("info")}
                  >
                    ← {locale === "fr" ? "Retour" : "Back"}
                  </Button>
                  <Button
                    bgVar="var(--color-scx-primary)"
                    fgVar="#fff"
                    className="flex-1"
                    onClick={goToReview}
                  >
                    {locale === "fr" ? "Continuer →" : "Continue →"}
                  </Button>
                </div>
              </div>
            )}

            {/* ── Step 3: Review & Submit ── */}
            {step === "review" && (
              <div className="space-y-6">
                {/* Contact summary */}
                <div className="rounded-2xl bg-white/5 border border-white/10 px-5 py-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs uppercase tracking-wide text-white/60 font-semibold">
                      {locale === "fr" ? "Vos informations" : "Your info"}
                    </h3>
                    <button
                      onClick={() => setStep("info")}
                      className="text-xs text-[var(--color-scx-primary)] hover:underline"
                    >
                      {locale === "fr" ? "Modifier" : "Edit"}
                    </button>
                  </div>
                  <p className="text-white font-semibold">{form.firstName} {form.lastName}</p>
                  <p className="text-white/70 text-sm">{form.email}</p>
                  {form.phone && <p className="text-white/70 text-sm">{form.phone}</p>}
                  <p className="text-white/70 text-sm capitalize mt-1">
                    {locale === "fr" ? "Rôle : " : "Role: "}{form.role}
                  </p>
                </div>

                {/* Selected classes */}
                <div className="rounded-2xl bg-white/5 border border-white/10 px-5 py-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs uppercase tracking-wide text-white/60 font-semibold">
                      {locale === "fr" ? "Cours sélectionnés" : "Selected classes"}
                    </h3>
                    <button
                      onClick={() => setStep("classes")}
                      className="text-xs text-[var(--color-scx-primary)] hover:underline"
                    >
                      {locale === "fr" ? "Modifier" : "Edit"}
                    </button>
                  </div>
                  <div className="space-y-2">
                    {selectedClasses.map((cls) => {
                      const name = cls.name?.[locale] || cls.name?.fr || "";
                      const price = Number(cls.price) || 0;
                      const classRebate = Number(cls.rebate) || 0;
                      const studentRebateAmt = studentRebate ? Math.min(REBATE_AMOUNT, price) : 0;
                      const promo = getPromoDiscount(cls);
                      const mercredi = getMercredisDiscount(cls);
                      const final = Math.max(0, price - classRebate - studentRebateAmt - promo - mercredi);
                      const hasDiscount = price !== final;
                      return (
                        <div key={cls.id} className="flex justify-between items-center text-sm">
                          <span className="text-white">{name}</span>
                          <span className="text-white/80 font-semibold">
                            {hasDiscount ? (
                              <>
                                <span className="line-through text-white/40 mr-2">${price.toFixed(2)}</span>
                                ${final.toFixed(2)}
                              </>
                            ) : (
                              `$${price.toFixed(2)}`
                            )}
                          </span>
                        </div>
                      );
                    })}
                    {Object.entries(dropinSelections)
                      .filter(([, weeks]) => weeks.length > 0)
                      .map(([id, weeks]) => {
                        const cls = classes.find((c) => c.id === Number(id));
                        if (!cls) return null;
                        const name = cls.name?.[locale] || cls.name?.fr || "";
                        const dropinPrice = Number(cls.dropin_price) || 0;
                        return (
                          <div key={`dropin-${id}`} className="text-sm">
                            <div className="flex justify-between items-center">
                              <span className="text-white">{name} <span className="text-white/40 text-xs">({locale === "fr" ? "à la carte" : "drop-in"})</span></span>
                              <span className="text-white/80 font-semibold">${(dropinPrice * weeks.length).toFixed(2)}</span>
                            </div>
                            <div className="ml-0 mt-1 flex flex-wrap gap-1">
                              {weeks.sort().map((d) => (
                                <span key={d} className="text-xs bg-white/10 text-white/60 px-2 py-0.5 rounded">
                                  {new Date(d + "T12:00:00").toLocaleDateString(locale === "fr" ? "fr-CA" : "en-CA", { month: "short", day: "numeric" })}
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Student rebate */}
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={studentRebate}
                    onChange={(e) => setStudentRebate(e.target.checked)}
                    className="mt-1 h-4 w-4 accent-[var(--color-scx-primary)]"
                  />
                  <div>
                    <span className="text-sm text-white font-medium">
                      {locale === "fr" ? "Rabais étudiant (-$40 / cours)" : "Student rebate (-$40 / class)"}
                    </span>
                    <p className="text-xs text-white/50 mt-0.5">
                      {locale === "fr"
                        ? "Pour les étudiant·e·s à temps plein. Jamais sous $0."
                        : "For full-time students. Never below $0."}
                    </p>
                  </div>
                </label>

                {/* Promo codes */}
                <div className="space-y-2">
                  {appliedPromos.map((p) => (
                    <div key={p.code} className="flex items-center justify-between rounded-2xl bg-green-900/40 border border-green-500/30 px-4 py-3">
                      <div className="text-sm">
                        <span className="text-green-300 font-semibold">{p.name}</span>
                        <span className="text-green-400/70 ml-2">
                          ({p.discount_type === "percent"
                            ? `−${p.discount_value}%`
                            : `−$${Number(p.discount_value).toFixed(2)}`})
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setAppliedPromos((prev) => prev.filter((x) => x.code !== p.code)); setPromoError(null); }}
                        className="text-white/40 hover:text-white/70 text-lg leading-none ml-3"
                        aria-label="Remove promo code"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <div className="space-y-1.5">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={promoInput}
                        onChange={(e) => { setPromoInput(e.target.value.toUpperCase()); setPromoError(null); }}
                        onKeyDown={(e) => e.key === "Enter" && handleApplyPromo()}
                        placeholder={locale === "fr" ? "Code promo" : "Promo code"}
                        className="flex-1 rounded-2xl bg-white/10 border border-white/15 px-4 py-2.5 text-white placeholder-white/40 outline-none focus:ring-2 focus:ring-white/30 text-sm font-mono uppercase"
                      />
                      <button
                        type="button"
                        onClick={handleApplyPromo}
                        disabled={promoLoading || !promoInput.trim()}
                        className="px-4 py-2.5 rounded-2xl bg-white/10 border border-white/15 text-sm text-white/80 font-semibold hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                      >
                        {promoLoading
                          ? <Spinner size={14} />
                          : locale === "fr" ? "Utiliser" : "Redeem"}
                      </button>
                    </div>
                    {promoError && <p className="text-red-400 text-xs px-1">{promoError}</p>}
                  </div>
                </div>

                {/* Note */}
                <div>
                  <label className="block text-[11px] uppercase tracking-wide text-white/70 mb-1.5">
                    {locale === "fr" ? "Message (optionnel)" : "Message (optional)"}
                  </label>
                  <textarea
                    rows={4}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full rounded-2xl bg-white/10 border border-white/15 px-4 py-3 text-white placeholder-white/40 outline-none focus:ring-2 focus:ring-white/30 resize-none"
                    placeholder={locale === "fr" ? "Questions, commentaires…" : "Questions, comments…"}
                  />
                </div>

                {/* Total */}
                <div className="rounded-2xl bg-[var(--color-scx-primary)]/20 border border-[var(--color-scx-primary)]/40 px-5 py-4 flex items-center justify-between">
                  <span className="font-bold text-white">
                    {locale === "fr" ? "Total" : "Total"}
                  </span>
                  <span className="text-2xl font-extrabold text-white">
                    ${total.toFixed(2)} <span className="text-sm font-normal text-white/60">CAD</span>
                  </span>
                </div>

                {/* Honeypot — hidden from humans, bots fill it */}
                <input
                  type="text"
                  name="website"
                  value=""
                  onChange={() => {}}
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  className="hidden"
                />

                {errors.submit && (
                  <p className="text-red-400 text-sm text-center">{errors.submit}</p>
                )}

                <div className="flex gap-3">
                  <Button
                    bgVar="transparent"
                    fgVar="#fff"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setStep("classes")}
                  >
                    ← {locale === "fr" ? "Retour" : "Back"}
                  </Button>
                  <Button
                    bgVar="var(--color-scx-primary)"
                    fgVar="#fff"
                    className="flex-1"
                    onClick={handleSubmit}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <span className="inline-flex items-center gap-2">
                        <Spinner size={16} />
                        {locale === "fr" ? "Envoi…" : "Sending…"}
                      </span>
                    ) : (
                      locale === "fr" ? "Envoyer →" : "Submit →"
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Container>
      </section>

      <Footer />
    </>
  );
}
