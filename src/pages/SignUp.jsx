// SignUp.jsx — PRIMARY class registration flow (current system, not legacy GAS)
//
// 3-step wizard:
//   1. "classes"  — browse and pick classes (or pre-select via ?class=ID URL param)
//   2. "info"     — contact info + dance role (lead/follow/versatile)
//   3. "review"   — pricing summary, promo codes, monthly billing option, submit
//
// After submit: a Square payment button is shown — clicking it calls /public/square-link
//   which creates a Square invoice and redirects the user to pay by card.
//   Monthly payment option skips Square and is handled later by an admin.
//
// Key features:
//   - Dome cross-auth: users logged into Dome (admin tool) auto-fill the form via a
//     cookie (dome_signup on .swingconnexion.com) or ?domeToken= URL param
//   - Summer 2-for-1: if exactly 2 summer classes are selected, the second one is free
//   - is_pass classes bypass the class-listing step and jump straight to "info"
//   - Drop-in: select individual week dates instead of the full block
//   - Promo codes: validated via API, multiple can stack, apply per-class or order-wide
//   - Mercredis Swing discount: $20 off "Swing 1" classes when the mercredi-swing API flag is active
//   - reCAPTCHA v3 for bot protection (loaded lazily on mount)
//   - honeypot: hidden "website" field — bots fill it, humans don't; server rejects if set
//   - elapsedMs: time since page load, sent to server to detect suspiciously-fast bots
//
// OLD registration flow is in Registration.jsx (Google Apps Script backend) — no longer used.

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useI18n } from "../i18n/useI18n";
import PageHero from "../components/PageHero";
import Footer from "../components/Footer";
import Container from "../components/Container";
import Button from "../components/Button";
import Spinner from "../components/Spinner";
import { trackRegistration } from "../scripts/analytics";

const API = "https://api.swingconnexion.com/public";
const GST_RATE = 0.05;
const QST_RATE = 0.09975;
const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

// Dome cross-auth cookie: set on .swingconnexion.com so it's accessible on both
// swingconnexion.com (public site) and dome.swingconnexion.com (admin tool).
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

const STEPS = ["classes", "info", "review"];

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

function ShareModal({ url, lang, onClose }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl border border-white/15 bg-[var(--color-scx-secondary)] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-white font-bold text-lg mb-1">
          {lang === "fr" ? "Partager ce cours" : "Share this class"}
        </h3>
        <p className="text-white/50 text-sm mb-4">
          {lang === "fr" ? "Copiez le lien pour partager directement vers ce cours." : "Copy the link to share directly to this class."}
        </p>
        <div className="flex gap-2">
          <input
            readOnly
            value={url}
            className="flex-1 min-w-0 rounded-2xl bg-white/10 border border-white/15 px-4 py-2.5 text-sm text-white/80 outline-none"
          />
          <button
            onClick={copy}
            className="flex-shrink-0 rounded-2xl bg-[var(--color-scx-primary)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:opacity-90"
          >
            {copied ? "✓" : lang === "fr" ? "Copier" : "Copy"}
          </button>
        </div>
        <button
          onClick={onClose}
          className="mt-4 w-full text-center text-sm text-white/40 hover:text-white/70"
        >
          {lang === "fr" ? "Fermer" : "Close"}
        </button>
      </div>
    </div>
  );
}

function ClassCard({ cls, selected, onToggle, lang, dropinWeeks = [], onDropinToggle, expandedByDefault = false }) {
  const [descExpanded, setDescExpanded] = useState(expandedByDefault);
  const [showShare, setShowShare] = useState(false);
  const shareUrl = `${window.location.origin}${lang === "fr" ? "/fr" : "/en"}/signup?class=${cls.id}`;
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
      <div className="flex-shrink-0 flex flex-col items-end gap-2">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setShowShare(true); }}
          className="w-7 h-7 rounded-full bg-[var(--color-scx-primary)] hover:opacity-80 flex items-center justify-center transition-opacity"
          title={lang === "fr" ? "Partager" : "Share"}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-white">
            <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
          </svg>
        </button>
        <div className="text-right">
          {rebate > 0 && (
            <div className="text-sm text-white/40 line-through">${price.toFixed(2)}</div>
          )}
          <span className="font-bold text-white text-lg">
            ${finalPrice.toFixed(2)}
          </span>
          <div className="text-xs text-white/50">CAD</div>
        </div>
      </div>
    </div>
  );
  const shareModal = showShare ? <ShareModal url={shareUrl} lang={lang} onClose={() => setShowShare(false)} /> : null;

  if (!isDropin) {
    return (
      <>
        {shareModal}
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
      </>
    );
  }

  // Drop-in enabled: show full-class + per-week options
  return (
    <>
      {shareModal}
      <div className={`rounded-2xl border px-5 py-4 transition-all ${
        isActive
          ? "border-[var(--color-scx-primary)] bg-[var(--color-scx-primary)]/15 ring-1 ring-[var(--color-scx-primary)]"
          : "border-white/15 bg-white/5"
      }`}>
      <button type="button" onClick={onToggle} className="w-full text-left">
        {cardBody}
      </button>

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
    </>
  );
}

export default function SignUp() {
  const { lang } = useParams();
  const [searchParams] = useSearchParams();
  const { t } = useI18n();
  const locale = (lang || "fr").startsWith("en") ? "en" : "fr";

  const [step, setStep] = useState("classes");
  const [loadTime] = useState(() => Date.now());
  const preselectId = Number(searchParams.get("class")) || null;

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

  // "How did you hear about us?" — only asked of brand-new students, never Dome-authenticated ones
  const [referralSources, setReferralSources] = useState([]);
  const [selectedReferralSources, setSelectedReferralSources] = useState([]);
  useEffect(() => {
    fetch(`${API}/referral-sources`).then((r) => r.json()).then(setReferralSources).catch(() => {});
  }, []);

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
  const [payMonthly, setPayMonthly] = useState(false);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  // Student credit (Dome → student → Credit): opt-in, with how much to use.
  const [useCredit, setUseCredit] = useState(false);
  const [creditInput, setCreditInput] = useState("");
  const [squareLoading, setSquareLoading] = useState(false);
  const [squareError, setSquareError] = useState(null);

  // This is a single-page step flow (no route change between steps), so
  // React Router's scroll restoration never kicks in — without this, a step
  // change while scrolled down (e.g. hitting "Review" from the bottom of a
  // long class list) leaves the next step's content below the fold, looking
  // like the page did nothing.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step, submitted]);

  // Mercredis Swing mode
  const [mercredisSwing, setMercredisSwing] = useState(false);
  const [rebateAmount, setRebateAmount] = useState(20);
  useEffect(() => {
    fetch(`${API}/mercredi-swing`).then((r) => r.json()).then((d) => setMercredisSwing(!!d.active)).catch(() => {});
    fetch(`${API}/student-rebate`).then((r) => r.json()).then((d) => setRebateAmount(d.amount)).catch(() => {});
  }, []);

  // Liability waiver — required before submitting. Text is editable from Dome → Email Templates for now.
  const [waiverText, setWaiverText] = useState({ text_fr: "", text_en: "" });
  const [waiverAccepted, setWaiverAccepted] = useState(false);
  useEffect(() => {
    fetch(`${API}/waiver-text`).then((r) => r.json()).then(setWaiverText).catch(() => {});
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
        // Only show upcoming / current classes (never show passes in regular listing)
        const today = new Date().toISOString().slice(0, 10);
        const filtered = data.filter((c) => {
            if (c.is_pass) return false;
            if (!c.date) return false;
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
        const preselect = searchParams.get("class");
        if (preselect) {
          const id = Number(preselect);
          // Check passes separately (filtered out of `filtered` above)
          const passMatch = data.find((c) => c.id === id && c.is_pass);
          if (passMatch) {
            setClasses([passMatch]);
            setSelectedIds(new Set([id]));
            setStep("info");
            return;
          }
          const match = filtered.find((c) => c.id === id);
          if (match) {
            setSelectedIds(new Set([id]));
            // If it's a non-summer preselect, only show that class
            if (!match.is_summer) {
              setClasses([match]);
              return;
            }
          }
        }
        setClasses(filtered);
      })
      .catch(() => setClassError("Failed to load classes. Please refresh."))
      .finally(() => setLoadingClasses(false));
  }, [step]);

  // Computed totals
  const selectedClasses = classes.filter((c) => selectedIds.has(c.id));
  // summerBundle: exactly 2 summer classes selected → second one renders as $0 (2-for-1 promo)
  const summerBundle = selectedClasses.length === 2 && selectedClasses.every((c) => !!c.is_summer);
  // isPassMode: a pass was pre-selected via ?class=ID — skips class listing, goes straight to info step
  const isPassMode = selectedClasses.length === 1 && !!selectedClasses[0]?.is_pass;

  const contributorRebatePct = domeUser?.class_rebate > 0 ? Number(domeUser.class_rebate) : 0;

  function getContributorDiscount(cls) {
    if (!contributorRebatePct) return 0;
    const price = Number(cls.price) || 0;
    return parseFloat((price * contributorRebatePct / 100).toFixed(2));
  }

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

  const total = selectedClasses.reduce((sum, c, idx) => {
    if (summerBundle && idx === 1) return sum; // 2-for-1: second summer class always free
    const price = Number(c.price) || 0;
    const classRebate = Number(c.rebate) || 0;
    const studentRebateAmt = studentRebate ? Math.min(rebateAmount, price) : 0;
    const promo = getPromoDiscount(c);
    const mercredi = getMercredisDiscount(c);
    const contributor = getContributorDiscount(c);
    return sum + Math.max(0, price - classRebate - studentRebateAmt - promo - mercredi - contributor);
  }, 0) + dropinTotal;

  const orderGst = parseFloat((total * GST_RATE).toFixed(2));
  const orderQst = parseFloat((total * QST_RATE).toFixed(2));
  const orderGrandTotal = parseFloat((total + orderGst + orderQst).toFixed(2));

  // Credit only for a logged-in student (a guest never sees anyone's
  // balance), never for contributors (they pay from their own ledger).
  // It comes off the taxed total, like money. The server re-checks all of
  // this against the real balance -- what's sent is only a ceiling.
  const availableCredit = domeUser && domeUser.idstudent_types !== 6 ? Number(domeUser.credit) || 0 : 0;
  const maxCredit = parseFloat(Math.min(availableCredit, orderGrandTotal).toFixed(2));
  const creditApplied = useCredit
    ? parseFloat(Math.min(Math.max(Number(creditInput) || 0, 0), maxCredit).toFixed(2))
    : 0;

  function setField(key, val) {
    setForm((p) => ({ ...p, [key]: val }));
    if (errors[key]) setErrors((p) => ({ ...p, [key]: null }));
  }

  function validateInfo() {
    const e = {};
    if (!form.firstName.trim()) e.firstName = locale === "fr" ? "Requis" : "Required";
    if (!form.lastName.trim()) e.lastName = locale === "fr" ? "Requis" : "Required";
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = locale === "fr" ? "Courriel invalide" : "Invalid email";
    if (!isPassMode && !form.role) e.role = locale === "fr" ? "Veuillez choisir un rôle" : "Please choose a role";
    return e;
  }

  function goToInfo() {
    const hasDropins = Object.values(dropinSelections).some((w) => w.length > 0);
    if (selectedIds.size === 0 && !hasDropins) {
      setClassError(locale === "fr" ? "Veuillez sélectionner au moins un cours." : "Please select at least one class.");
      return;
    }
    setClassError(null);
    setStep("info");
  }

  function goToReview() {
    const e = validateInfo();
    if (Object.keys(e).length) { setErrors(e); return; }
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
          honeypot: "",                       // always blank from this client; server rejects if non-empty
          elapsedMs: Date.now() - loadTime,   // time since page load; server flags very fast submits as bots
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
          payMonthly,
          note,
          promoCodes: appliedPromos.map((p) => p.code),
          waiverAccepted,
          referralSourceIds: selectedReferralSources,
          creditToUse: creditApplied,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed.");
      setSubmitResult(data);
      if (data.creditRemaining != null) setDomeUser((u) => (u ? { ...u, credit: data.creditRemaining } : u));
      setSubmitted(true);
      trackRegistration({ value: total });
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

              {/* Credit spent on this order */}
              {submitResult?.creditUsed > 0 && (
                <div className="rounded-2xl bg-white/5 border border-white/10 px-5 py-4 mb-4 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/70">{locale === "fr" ? "Crédit utilisé" : "Credit used"}</span>
                    <span className="text-white font-semibold">−${submitResult.creditUsed.toFixed(2)}</span>
                  </div>
                  {submitResult.creditRemaining != null && (
                    <div className="flex justify-between">
                      <span className="text-white/50 text-xs">{locale === "fr" ? "Crédit restant" : "Credit remaining"}</span>
                      <span className="text-white/50 text-xs">${submitResult.creditRemaining.toFixed(2)}</span>
                    </div>
                  )}
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

              {/* Contributor balance summary — replaces Square button */}
              {submitResult?.contributorStats ? (
                <div className="mt-6 rounded-2xl bg-amber-900/30 border border-amber-500/30 px-5 py-5">
                  <p className="text-xs uppercase tracking-wide text-amber-400/70 font-semibold mb-3">
                    {locale === "fr" ? "Solde contributeur·trice SCX" : "SCX Contributor balance"}
                  </p>
                  {(() => {
                    const charged = submitResult.created.reduce((s, r) => s + (r.price || 0), 0);
                    const { remainder, rebate_remaining } = submitResult.contributorStats;
                    return (
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-white/70">{locale === "fr" ? "Prélevé ce soir" : "Charged tonight"}</span>
                          <span className="text-white font-semibold">−${charged.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between border-t border-amber-500/20 pt-2">
                          <span className="text-white/70">{locale === "fr" ? "Solde restant" : "Remaining balance"}</span>
                          <span className={`font-bold ${remainder < 0 ? "text-red-400" : "text-amber-300"}`}>
                            ${remainder.toFixed(2)}
                          </span>
                        </div>
                        {rebate_remaining > 0 && (
                          <div className="flex justify-between">
                            <span className="text-white/50 text-xs">{locale === "fr" ? "Rabais restant (10%)" : "Remaining rebate (10%)"}</span>
                            <span className="text-white/50 text-xs">${rebate_remaining.toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              ) : (
                /* Square payment option — non-contributors only */
                (() => {
                  const squareTotal = submitResult?.created?.reduce((sum, r) => sum + (r.price || 0), 0) ?? 0;
                  if (squareTotal <= 0) return null;
                  const squareTotalFmt = `$${squareTotal.toFixed(2)}`;
                  return (
                    <div className="mt-6 rounded-2xl bg-white/5 border border-white/10 px-5 py-5 text-center">
                      <p className="text-sm text-white/70 mb-1">
                        {payMonthly
                          ? (locale === "fr"
                            ? "Payez le premier versement maintenant par carte via Square :"
                            : "Pay the first installment now by card via Square:")
                          : (locale === "fr"
                            ? "Vous pouvez payer immédiatement par carte de crédit via Square :"
                            : "You can pay right now by credit card via Square:")}
                      </p>
                      {payMonthly && (
                        <p className="text-xs text-white/40 mb-4">
                          {locale === "fr"
                            ? "Les 2 versements suivants seront facturés mensuellement."
                            : "The 2 remaining payments will be invoiced monthly."}
                        </p>
                      )}
                      {!payMonthly && <div className="mb-4" />}
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
                        ) : payMonthly ? (
                          locale === "fr"
                            ? `Payer le 1er versement (${squareTotalFmt}) →`
                            : `Pay 1st installment (${squareTotalFmt}) →`
                        ) : (
                          locale === "fr"
                            ? `Payer par carte (${squareTotalFmt}) →`
                            : `Pay by card (${squareTotalFmt}) →`
                        )}
                      </Button>
                      <p className="text-xs text-white/40 mt-3">
                        {locale === "fr"
                          ? "Des frais de traitement peuvent s'appliquer."
                          : "Processing fees may apply."}
                      </p>
                    </div>
                  );
                })()
              )}

              <div className="text-center mt-4">
                {submitResult?.contributorStats && domeUser?.idstudents ? (
                  <a
                    href={`https://dome.swingconnexion.com/contributors/${domeUser.idstudents}`}
                    className="text-sm text-amber-400 hover:underline"
                  >
                    {locale === "fr" ? "Voir mon compte contributeur·trice →" : "View my contributor account →"}
                  </a>
                ) : (
                  <a
                    href="https://dome.swingconnexion.com/my-invoices"
                    className="text-sm text-[var(--color-scx-primary)] hover:underline"
                  >
                    {locale === "fr" ? "Voir mes factures sur Dome →" : "View my invoices on Dome →"}
                  </a>
                )}
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

                    {!isPassMode && (
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
                    )}

                    {loginMode === "new" && !domeUser && referralSources.length > 0 && (
                      <div>
                        <label className="block text-[11px] uppercase tracking-wide text-white/70 mb-2">
                          {locale === "fr" ? "Comment avez-vous entendu parler de nous ?" : "How did you hear about us?"}
                        </label>
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
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                  checked
                                    ? "bg-[var(--color-scx-primary)] text-white"
                                    : "bg-white/10 text-white/60 hover:bg-white/20"
                                }`}
                              >
                                {locale === "fr" ? src.name_fr : src.name_en}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3 pt-2">
                      <Button bgVar="transparent" fgVar="#fff" variant="outline" className="flex-1" onClick={() => setStep("classes")}>
                        ← {locale === "fr" ? "Retour" : "Back"}
                      </Button>
                      <Button bgVar="var(--color-scx-primary)" fgVar="#fff" className="flex-1 justify-center" onClick={goToReview}>
                        {locale === "fr" ? "Vérifier →" : "Review →"}
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
                    ? "Sélectionnez un ou plusieurs cours. Les projets d'été sont offerts en formule 2 pour 1."
                    : "Select one or more classes. Summer projects are available at a 2-for-1 rate."}
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

                {(() => {
                  const preselectClass = preselectId ? classes.find((c) => c.id === preselectId) : null;
                  const isSummerPreselect = !!preselectClass?.is_summer;
                  const regularClasses = classes.filter((c) => !c.is_summer);
                  const summerClasses = classes.filter((c) => !!c.is_summer);

                  function makeCard(cls) {
                    return (
                      <ClassCard
                        key={cls.id}
                        cls={cls}
                        selected={selectedIds.has(cls.id)}
                        dropinWeeks={dropinSelections[cls.id] || []}
                        lang={locale}
                        expandedByDefault={preselectId === cls.id}
                        onToggle={() => {
                          setDropinSelections((prev) => { const n = { ...prev }; delete n[cls.id]; return n; });
                          setSelectedIds((prev) => {
                            const next = new Set(prev);
                            next.has(cls.id) ? next.delete(cls.id) : next.add(cls.id);
                            return next;
                          });
                          setClassError(null);
                        }}
                        onDropinToggle={(date) => {
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
                    );
                  }

                  // Non-summer preselect: show only that class (share link behaviour)
                  if (preselectId && !isSummerPreselect) {
                    return <div className="space-y-3">{classes.map(makeCard)}</div>;
                  }

                  // Summer preselect: pinned class + "pick a 2nd" section
                  if (isSummerPreselect) {
                    const others = summerClasses.filter((c) => c.id !== preselectId);
                    return (
                      <>
                        <div className="space-y-3 mb-6">
                          {makeCard(preselectClass)}
                        </div>
                        {others.length > 0 && (
                          <>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-lg">☀️</span>
                              <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wide">
                                {locale === "fr"
                                  ? "2 pour 1 — choisissez un 2e projet !"
                                  : "2-for-1 — pick a second project!"}
                              </h3>
                            </div>
                            <p className="text-xs text-white/50 mb-3">
                              {locale === "fr"
                                ? "Ajoutez un 2e projet cet été et profitez du tarif 2 pour 1."
                                : "Add a 2nd summer project and get the 2-for-1 rate."}
                            </p>
                            <div className="space-y-3">{others.map(makeCard)}</div>
                          </>
                        )}
                      </>
                    );
                  }

                  // No preselect: two sections
                  return (
                    <>
                      {regularClasses.length > 0 && (
                        <>
                          <h3 className="text-xs font-bold text-white/50 uppercase tracking-wide mb-3">
                            {locale === "fr" ? "Cours réguliers" : "Regular classes"}
                          </h3>
                          <div className="space-y-3 mb-8">{regularClasses.map(makeCard)}</div>
                        </>
                      )}
                      {summerClasses.length > 0 && (
                        <>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">☀️</span>
                            <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wide">
                              {locale === "fr" ? "Projets d'été — 2 pour 1" : "Summer Projects — 2 for 1"}
                            </h3>
                          </div>
                          <p className="text-xs text-white/50 mb-3">
                            {locale === "fr"
                              ? "Inscrivez-vous à 2 projets d'été et payez moitié prix chacun."
                              : "Sign up for 2 summer projects and pay half price each."}
                          </p>
                          <div className="space-y-3">{summerClasses.map(makeCard)}</div>
                        </>
                      )}
                    </>
                  );
                })()}

                <div className="flex gap-3 mt-6">
                  <Button
                    bgVar="var(--color-scx-primary)"
                    fgVar="#fff"
                    className="w-full justify-center"
                    onClick={goToInfo}
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
                  {!isPassMode && (
                    <p className="text-white/70 text-sm capitalize mt-1">
                      {locale === "fr" ? "Rôle : " : "Role: "}{form.role}
                    </p>
                  )}
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
                  {summerBundle && (
                    <div className="mb-3 px-3 py-2 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-semibold">
                      ☀️ {locale === "fr" ? "Offre 2 pour 1 — le 2e projet est gratuit !" : "2-for-1 deal — the 2nd project is free!"}
                    </div>
                  )}
                  <div className="space-y-2">
                    {selectedClasses.map((cls, idx) => {
                      const name = cls.name?.[locale] || cls.name?.fr || "";
                      const price = Number(cls.price) || 0;
                      const isFree = summerBundle && idx === 1;
                      if (isFree) {
                        return (
                          <div key={cls.id} className="flex justify-between items-center text-sm">
                            <span className="text-white">{name}</span>
                            <span className="text-white/80 font-semibold">
                              <span className="line-through text-white/40 mr-2">${price.toFixed(2)}</span>
                              <span className="text-amber-400">$0.00</span>
                            </span>
                          </div>
                        );
                      }
                      const classRebate = Number(cls.rebate) || 0;
                      const studentRebateAmt = studentRebate ? Math.min(rebateAmount, price) : 0;
                      const promo = getPromoDiscount(cls);
                      const mercredi = getMercredisDiscount(cls);
                      const contributor = getContributorDiscount(cls);
                      const final = Math.max(0, price - classRebate - studentRebateAmt - promo - mercredi - contributor);
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

                {/* Contributor rebate badge — auto-applied, informational only */}
                {contributorRebatePct > 0 && !isPassMode && (
                  <div className="flex items-center gap-3 rounded-2xl bg-amber-900/30 border border-amber-500/30 px-4 py-3">
                    <span className="text-amber-400 text-base">✦</span>
                    <div>
                      <span className="text-sm text-amber-200 font-medium">
                        {locale === "fr"
                          ? `Rabais Contributeur·trice SCX (−${contributorRebatePct}%)`
                          : `SCX Contributor rebate (−${contributorRebatePct}%)`}
                      </span>
                      <p className="text-xs text-amber-400/70 mt-0.5">
                        {locale === "fr" ? "Appliqué automatiquement." : "Applied automatically."}
                      </p>
                    </div>
                  </div>
                )}

                {/* Student rebate — not applicable for passes or when rebate is $0 */}
                {!isPassMode && rebateAmount > 0 && (
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={studentRebate}
                      onChange={(e) => setStudentRebate(e.target.checked)}
                      className="mt-1 h-4 w-4 accent-[var(--color-scx-primary)]"
                    />
                    <div>
                      <span className="text-sm text-white font-medium">
                        {locale === "fr" ? `Rabais étudiant (-$${rebateAmount} / cours)` : `Student rebate (-$${rebateAmount} / class)`}
                      </span>
                      <p className="text-xs text-white/50 mt-0.5">
                        {locale === "fr"
                          ? "Pour les étudiant·e·s à temps plein. Jamais sous $0."
                          : "For full-time students. Never below $0."}
                      </p>
                    </div>
                  </label>
                )}

                {/* Monthly payments — summer projects only */}
                {!isPassMode && selectedClasses.some((c) => !!c.is_summer) && (
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={payMonthly}
                      onChange={(e) => setPayMonthly(e.target.checked)}
                      className="mt-1 h-4 w-4 accent-[var(--color-scx-primary)]"
                    />
                    <div>
                      <span className="text-sm text-white font-medium">
                        {locale === "fr" ? "Payer en 3 versements mensuels" : "Pay in 3 monthly payments"}
                      </span>
                      <p className="text-xs text-white/50 mt-0.5">
                        {locale === "fr"
                          ? "Vous recevrez une facture par mois pendant 3 mois."
                          : "You'll receive one invoice per month for 3 months."}
                      </p>
                    </div>
                  </label>
                )}

                {/* Promo codes — not applicable for passes */}
                {!isPassMode && <div className="space-y-2">
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
                </div>}

                {/* Student credit — only when there's some to use */}
                {maxCredit > 0 && (
                  <div className="space-y-2">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useCredit}
                        onChange={(e) => {
                          setUseCredit(e.target.checked);
                          if (e.target.checked) setCreditInput(maxCredit.toFixed(2));
                        }}
                        className="mt-1 h-4 w-4 accent-[var(--color-scx-primary)]"
                      />
                      <span className="text-sm text-white font-medium">
                        {locale === "fr"
                          ? `Utiliser mon crédit (${availableCredit.toFixed(2)} $ disponible)`
                          : `Use credit ($${availableCredit.toFixed(2)} available)`}
                      </span>
                    </label>
                    {useCredit && (
                      <div className="flex items-center gap-2 pl-7">
                        <span className="text-sm text-white/70">{locale === "fr" ? "Montant :" : "Amount:"}</span>
                        <span className="text-sm text-white/70">$</span>
                        <input
                          type="number"
                          min="0"
                          max={maxCredit}
                          step="0.01"
                          value={creditInput}
                          onChange={(e) => setCreditInput(e.target.value)}
                          onBlur={() => setCreditInput(creditApplied.toFixed(2))}
                          className="w-28 rounded-2xl bg-white/10 border border-white/15 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-white/30 text-sm"
                        />
                        <span className="text-xs text-white/40">
                          {locale === "fr" ? `max ${maxCredit.toFixed(2)} $` : `max $${maxCredit.toFixed(2)}`}
                        </span>
                      </div>
                    )}
                  </div>
                )}

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

                {/* Tax breakdown + Total */}
                <div className="rounded-2xl bg-[var(--color-scx-primary)]/20 border border-[var(--color-scx-primary)]/40 px-5 py-4 space-y-2">
                  {(() => {
                    const gst = orderGst;
                    const qst = orderQst;
                    const grandTotal = parseFloat((orderGrandTotal - creditApplied).toFixed(2));
                    return (
                      <>
                        <div className="flex justify-between text-sm text-white/60">
                          <span>{locale === "fr" ? "Sous-total" : "Subtotal"}</span>
                          <span>${total.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-white/60">
                          <span>TPS / GST (5%)</span>
                          <span>${gst.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-white/60">
                          <span>TVQ / QST (9.975%)</span>
                          <span>${qst.toFixed(2)}</span>
                        </div>
                        {creditApplied > 0 && (
                          <div className="flex justify-between text-sm text-white/60">
                            <span>{locale === "fr" ? "Crédit utilisé" : "Credit used"}</span>
                            <span>−${creditApplied.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between pt-2 border-t border-white/20">
                          <span className="font-bold text-white">Total</span>
                          <span className="text-2xl font-extrabold text-white">
                            ${grandTotal.toFixed(2)} <span className="text-sm font-normal text-white/60">CAD</span>
                          </span>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Liability waiver — required, text editable from Dome */}
                {(waiverText.text_fr || waiverText.text_en) && (
                  <div className="rounded-2xl bg-white/5 border border-white/10 p-4 space-y-3">
                    <p className="text-xs text-white/60 whitespace-pre-line leading-relaxed">
                      {locale === "fr" ? waiverText.text_fr : waiverText.text_en}
                    </p>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={waiverAccepted}
                        onChange={(e) => setWaiverAccepted(e.target.checked)}
                        className="mt-1 h-4 w-4 accent-[var(--color-scx-primary)]"
                      />
                      <span className="text-sm text-white font-medium">
                        {locale === "fr" ? "J'ai lu et j'accepte" : "I have read and accept"} <span className="text-red-400">*</span>
                      </span>
                    </label>
                  </div>
                )}

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
                    disabled={submitting || !waiverAccepted}
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
