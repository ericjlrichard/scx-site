import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useI18n } from "../i18n/useI18n";
import Container from "../components/Container";
import Button from "../components/Button";
import Footer from "../components/Footer";
import { classes } from "../data/classes";
import Spinner, { LoadingOverlay } from "../components/Spinner";
import Field from "../components/Field";
import Select from "../components/Select";
import { usePopup } from "../components/Popup";
import { useTitle } from "../hooks/useTitle";
import MetaTags from "../components/MetaTags";

const GAS_URL = import.meta.env.VITE_REGISTRATIONS_URL;
const REG_SECRET = import.meta.env.VITE_REG_SECRET || "";
const PROMO_VALIDATE_URL = import.meta.env.VITE_PROMO_VALIDATE_URL; // GET ?code=...
const PROMOS_LIST_URL = import.meta.env.VITE_PROMOS_URL; // GET list

function addQuery(url, params) {
  try {
    const u = new URL(url, window.location.origin);
    Object.entries(params).forEach(([k, v]) => {
      if (v != null) u.searchParams.set(k, v);
    });
    return u.toString();
  } catch {
    const sep = url.includes("?") ? "&" : "?";
    return url + sep + new URLSearchParams(params).toString();
  }
}

export default function Register() {
  const { t } = useI18n();
  const { lang } = useParams();
  const [sp] = useSearchParams();
  const navigate = useNavigate();
  const prefix = lang ? `/${lang}` : "";
  const [status, setStatus] = useState({ sending: false, ok: null, msg: "" });
  const { alert } = usePopup();

  const localeKey = (lang || "fr").startsWith("en") ? "en" : "fr";

  // Student rebate
  const REBATE_AMOUNT = 40; // dollars per class
  const [studentRebate, setStudentRebate] = useState(false);

  // Promo state
  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState(null); // {code,name,type:'percent'|'fixed',value:number,description,scope:'per_class'|'order_total'}
  const [activePromos, setActivePromos] = useState([]);

  useTitle(`${t("pages.register.title", "Registration")} – Swing ConneXion`);

  // Prefill selection via URL (?classId=a&classId=b OR ?classId=a,b)
  const initialSelected = new Set(
    sp
      .getAll("classId")
      .flatMap((v) => v.split(","))
      .filter(Boolean)
  );
  const [selectedSet, setSelectedSet] = useState(initialSelected);

  // i18n helpers
  const txt = {
    imgAlt: t("pages.register.imageAlt", "SCX dancers"),
    title: t("pages.register.title", "Registration").toUpperCase(),
    subtitle: t(
      "pages.register.subtitle",
      "Welcome, or welcome again to SCX - Choose your adventure!"
    ),
    role: t("pages.register.role", "Role"),
    lead: t("pages.register.role_lead", "Lead"),
    follow: t("pages.register.role_follow", "Follow"),
    versatile: t("pages.register.role_versatile", "Versatile"),
    classesLabel: t("pages.register.className", "Classes"),
    studentRebate: t("pages.register.studentRebate", "Student rebate ($40)"),
    studentRebateHelp: t(
      "pages.register.studentRebate_help",
      "Applies a $40 discount per selected class (never below $0)."
    ),
    studentRebateTitle: t(
      "pages.register.studentRebate_title",
      "Student rebate"
    ),
    totalDue: t("pages.register.totalDue", "Total due (CAD)"),
    note: t("pages.register.note", "Message"),
    sending: t("pages.register.sending", "Sending…"),
    submit: t("pages.register.submit", "Send"),
    spinner: t(
      "pages.register.spinnerMessage",
      "Creating registration(s), we'll take you to the payment and confirmation page afterwards!"
    ),
    atLeastOne: t(
      "pages.register.selectAtLeastOne",
      "Please select at least one class."
    ),
    okWord: t("pages.register.okCount", "ok"),
    failedWord: t("pages.register.failedCount", "failed"),
    someFailedPrefix: t(
      "pages.register.someFailedPrefix",
      "Some registrations failed"
    ),
    tryAgain: t("pages.register.tryAgain", "Try again."),
    netErr: t(
      "pages.register.networkError",
      "Network error. Please try again."
    ),
    okText: t("pages.register.ok", "OK"),

    // Promo i18n
    promoLabel: t("pages.register.promo.label", "Promo code"),
    promoPlaceholder: t("pages.register.promo.placeholder", "Enter code"),
    promoValidate: t("pages.register.promo.validate", "Validate"),
    promoValidTitle: t("pages.register.promo.validTitle", "Valid code"),
    promoValidMsgFallback: t(
      "pages.register.promo.validMessage_fallback",
      "Code accepted."
    ),
    promoInvalidTitle: t("pages.register.promo.invalidTitle", "Invalid code"),
    promoInvalidMsg: t(
      "pages.register.promo.invalidMessage",
      "This code is not valid."
    ),
    promoActiveTitle: t(
      "pages.register.promo.activeCodesTitle",
      "Active promo codes"
    ),
    promoAppliedBadge: t("pages.register.promo.appliedBadge", "Applied"),
  };

  // Data formatters
  const fmtPrice = (n) =>
    new Intl.NumberFormat(localeKey === "fr" ? "fr-CA" : "en-CA", {
      style: "currency",
      currency: "CAD",
      maximumFractionDigits: 2,
    }).format(n || 0);

  const fmtDate = (iso) =>
    new Date(iso).toLocaleDateString(localeKey === "fr" ? "fr-CA" : "en-CA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const selected = useMemo(
    () => classes.filter((c) => selectedSet.has(c.id)),
    [selectedSet]
  );

  // Compute row prices (student rebate, then promo)
  const perClassBeforeOrderPromo = useMemo(() => {
    return selected.map((c) => {
      const base = Number(c.price) || 0;
      const afterStudent = Math.max(
        0,
        base - (studentRebate ? REBATE_AMOUNT : 0)
      );

      let afterPerClass = afterStudent;
      if (appliedPromo && appliedPromo.scope === "per_class") {
        if (appliedPromo.type === "percent") {
          afterPerClass = Math.max(
            0,
            afterStudent * (1 - (Number(appliedPromo.value) || 0) / 100)
          );
        } else if (appliedPromo.type === "fixed") {
          afterPerClass = Math.max(
            0,
            afterStudent - (Number(appliedPromo.value) || 0)
          );
        }
      }
      return { id: c.id, base, afterStudent, afterPerClass };
    });
  }, [selected, studentRebate, appliedPromo]);

  // Apply order_total promo proportionally, if any
  const perClassFinal = useMemo(() => {
    const rows = perClassBeforeOrderPromo.map((r) => ({
      ...r,
      due: r.afterPerClass,
    }));
    if (!appliedPromo || appliedPromo.scope !== "order_total") return rows;

    const subtotal = rows.reduce((s, r) => s + r.due, 0);
    if (subtotal <= 0) return rows;

    let orderDiscount = 0;
    if (appliedPromo.type === "percent") {
      orderDiscount = (subtotal * (Number(appliedPromo.value) || 0)) / 100;
    } else if (appliedPromo.type === "fixed") {
      orderDiscount = Math.min(Number(appliedPromo.value) || 0, subtotal);
    }
    if (orderDiscount <= 0) return rows;

    return rows.map((r) => {
      const share = r.due / subtotal;
      const distributed = orderDiscount * share;
      return { ...r, due: Math.max(0, r.due - distributed) };
    });
  }, [perClassBeforeOrderPromo, appliedPromo]);

  const totalDueSum = useMemo(
    () => perClassFinal.reduce((s, r) => s + r.due, 0),
    [perClassFinal]
  );

  function toggleClass(id, checked) {
    setSelectedSet((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  // Fetch active promos (for display)
  useEffect(() => {
    let ignore = false;
    if (!PROMOS_LIST_URL) return;
    (async () => {
      try {
        const res = await fetch(PROMOS_LIST_URL);
        const data = await res.json().catch(() => ({}));
        if (!ignore && data?.ok && Array.isArray(data.promos)) {
          setActivePromos(data.promos);
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  // Validate promo
  const onValidatePromo = async () => {
    const code = (promoInput || "").trim().toUpperCase(); // normalize
    if (!code || !PROMO_VALIDATE_URL) {
      await alert({
        title: txt.promoInvalidTitle,
        message: txt.promoInvalidMsg,
        okText: txt.okText,
      });
      return;
    }
    try {
      const url = addQuery(PROMO_VALIDATE_URL, { code });
      const res = await fetch(url, { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (data?.ok && data?.promo) {
        setAppliedPromo(data.promo);
        await alert({
          title: txt.promoValidTitle,
          message: `${data.promo.name || code}\n${
            data.promo.description || txt.promoValidMsgFallback
          }`,
          okText: txt.okText,
        });
      } else {
        setAppliedPromo(null);
        await alert({
          title: txt.promoInvalidTitle,
          message: txt.promoInvalidMsg,
          okText: txt.okText,
        });
      }
    } catch {
      await alert({
        title: txt.promoInvalidTitle,
        message: txt.promoInvalidMsg,
        okText: txt.okText,
      });
    }
  };

  async function handleSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;

    // honeypot
    if (form.website?.value) return;

    const selectedIds = Array.from(selectedSet);
    if (selectedIds.length === 0) {
      setStatus({ sending: false, ok: false, msg: txt.atLeastOne });
      return;
    }

    const fd = new FormData(form);

    // Common fields (same for every row)
    const common = {
      lang: lang || "fr",
      source: "website",
      kind: "group",
      firstName: fd.get("firstName") || "",
      lastName: fd.get("lastName") || "",
      email: fd.get("email") || "",
      phone: fd.get("phone") || "",
      role: fd.get("role") || "",
      note: fd.get("note") || "",
    };
    if (REG_SECRET) common.secret = REG_SECRET;

    // Map final dues by class id
    const dueById = new Map(perClassFinal.map((r) => [r.id, r.due]));

    const rows = classes
      .filter((c) => selectedIds.includes(c.id))
      .map((c) => {
        const loc = c.locale[localeKey] || c.locale.fr;
        return {
          ...common,
          className: loc.name,
          totalDue: String(dueById.get(c.id) ?? 0),
          totalPaid: "",
          studentRebate: studentRebate ? "yes" : "no",
          // Pass along promo metadata for your sheet/logs
          promoCode: appliedPromo?.code || "",
          promoType: appliedPromo?.type || "",
          promoValue:
            appliedPromo?.value != null ? String(appliedPromo.value) : "",
          promoScope: appliedPromo?.scope || "",
        };
      });

    setStatus({ sending: true, ok: null, msg: "" });

    try {
      let okCount = 0,
        failCount = 0;
      for (const row of rows) {
        const body = new URLSearchParams(row);
        const res = await fetch(GAS_URL, { method: "POST", body });
        if (!res || (res.status && res.status >= 400)) failCount++;
        else okCount++;
      }

      if (okCount === rows.length) {
        navigate(
          `${prefix}/payment?classId=${encodeURIComponent(
            selectedIds.join(",")
          )}`
        );
        return;
      } else {
        setStatus({
          sending: false,
          ok: false,
          msg: `${txt.someFailedPrefix} (${okCount} ${txt.okWord}, ${failCount} ${txt.failedWord}). ${txt.tryAgain}`,
        });
      }
    } catch {
      setStatus({ sending: false, ok: false, msg: txt.netErr });
    }
  }

  return (
    <>
      <MetaTags i18nKey="meta.registration" path="/registration" />
      <LoadingOverlay show={status.sending}>{txt.spinner}</LoadingOverlay>

      {/* HERO */}
      <section className="relative isolate -mt-25">
        <img
          src="/images/katya_zack.jpg"
          alt={txt.imgAlt}
          className="absolute inset-0 h-[46vh] md:h-[54vh] w-full object-cover"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-black/25" />
        <div className="relative h-[46vh] md:h-[54vh] flex items-start">
          <Container>
            <h1 className="mt-30 md:mt-32 text-white font-extrabold leading-[0.95] text-[38px] md:text-[64px] tracking-tight drop-shadow-sm">
              {txt.title}
            </h1>
          </Container>
        </div>
      </section>

      {/* BODY */}
      <section className="bg-scx-secondary text-white">
        <Container>
          <div className="py-6 md:py-10">
            <p className="text-[14px] md:text-[15px] text-white/90 max-w-prose">
              {txt.subtitle}
            </p>

            <form
              className="mt-6 md:mt-8 grid gap-3 max-w-xl"
              onSubmit={handleSubmit}
              aria-busy={status.sending}
            >
              <fieldset
                disabled={status.sending}
                className={
                  status.sending ? "opacity-70 pointer-events-none" : ""
                }
              >
                {/* Honeypot */}
                <input
                  type="text"
                  name="website"
                  tabIndex="-1"
                  autoComplete="off"
                  className="hidden"
                  aria-hidden="true"
                />

                {/* Force groups */}
                <input type="hidden" name="kind" value="group" />

                {/* Contact */}
                <Field
                  id="firstName"
                  label={t("pages.register.firstName", "First name")}
                />
                <Field
                  id="lastName"
                  label={t("pages.register.lastName", "Last name")}
                />
                <Field id="email" label="Email" type="email" />
                <Field id="phone" label={t("pages.register.phone", "Phone")} />

                {/* Role */}
                <Select
                  id="role"
                  label={txt.role}
                  options={[
                    { value: "lead", label: txt.lead },
                    { value: "follow", label: txt.follow },
                    { value: "versatile", label: txt.versatile },
                  ]}
                />

                {/* Class checkboxes */}
                <div className="mb-3 md:mb-4">
                  <span className="block text-[12px] uppercase tracking-wide text-white/80">
                    {txt.classesLabel}
                  </span>
                  <div className="mt-2 grid gap-2">
                    {classes
                      .slice()
                      .sort((a, b) => a.startDate.localeCompare(b.startDate))
                      .map((c) => {
                        const loc = c.locale[localeKey] || c.locale.fr;
                        const checked = selectedSet.has(c.id);
                        // display price after student rebate and per-class promo (if any)
                        const row = perClassBeforeOrderPromo.find(
                          (r) => r.id === c.id
                        );
                        const displayPrice = row
                          ? row.afterPerClass
                          : Math.max(
                              0,
                              (Number(c.price) || 0) -
                                (studentRebate ? REBATE_AMOUNT : 0)
                            );
                        return (
                          <label
                            key={c.id}
                            className="flex gap-3 items-start rounded-2xl bg-white/10 border border-white/10 px-4 py-3"
                          >
                            <input
                              type="checkbox"
                              name="classIds"
                              value={c.id}
                              checked={checked}
                              onChange={(e) =>
                                toggleClass(c.id, e.target.checked)
                              }
                              className="mt-1 h-5 w-5 accent-[var(--color-scx-primary)]"
                            />
                            <div className="flex-1">
                              <div className="font-semibold">
                                {loc.name}
                                <span className="opacity-80">
                                  {" · "}
                                  {fmtPrice(displayPrice)}
                                  {" · "}
                                  {fmtDate(c.startDate)}
                                </span>
                              </div>
                              <div className="text-sm text-white/80">
                                {loc.desc}
                              </div>
                            </div>
                          </label>
                        );
                      })}
                  </div>
                </div>

                {/* Student rebate toggle + help popup (spacing) */}
                <div className="flex items-center gap-3 md:gap-4 mt-3 mb-2">
                  <label className="inline-flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={studentRebate}
                      onChange={(e) => setStudentRebate(e.target.checked)}
                      className="h-5 w-5 accent-[var(--color-scx-primary)]"
                    />
                    <span className="text-sm md:text-[15px] leading-6">
                      {txt.studentRebate}
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      alert({
                        title: txt.studentRebateTitle,
                        message: txt.studentRebateHelp,
                        okText: txt.okText,
                      })
                    }
                    className="inline-flex items-center ml-1"
                    aria-label={txt.studentRebateHelp}
                    title={txt.studentRebateHelp}
                  >
                    <img
                      src="/icons/blue_question_mark.png"
                      alt=""
                      aria-hidden="true"
                      className="h-5 w-5 md:h-6 md:w-6 translate-y-[1px] select-none opacity-85 hover:opacity-100 cursor-pointer"
                      draggable="false"
                    />
                  </button>
                </div>

                {/* Promo code row */}
                <div className="mt-2">
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <Field
                        id="promoCode"
                        label={txt.promoLabel}
                        placeholder={txt.promoPlaceholder}
                        value={promoInput}
                        onChange={(e) => setPromoInput(e.target.value)}
                      />
                    </div>
                    <Button
                      type="button"
                      onClick={onValidatePromo}
                      bgVar="var(--color-scx-primary)"
                      fgVar="var(--color-scx-secondary)"
                      className="mb-[10px]"
                    >
                      {txt.promoValidate}
                    </Button>
                  </div>

                  {/* Active promo list */}
                  {activePromos?.length > 0 && (
                    <div className="mt-2 text-white/85">
                      <div className="text-xs uppercase tracking-wide mb-1 opacity-80">
                        {txt.promoActiveTitle}
                      </div>
                      <ul className="space-y-1 text-sm">
                        {activePromos.map((p) => (
                          <li key={p.code} className="flex items-center gap-2">
                            <span className="font-semibold">{p.code}</span>
                            <span className="opacity-80">— {p.name || ""}</span>
                            {appliedPromo?.code?.toLowerCase() ===
                              p.code?.toLowerCase() && (
                              <span className="ml-2 rounded-md bg-white/10 border border-white/10 px-2 py-[2px] text-xs">
                                {txt.promoAppliedBadge}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Total due */}
                <div className="mt-2 md:mt-3">
                  <Field
                    id="totalDueDisplay"
                    name={null}
                    label={txt.totalDue}
                    value={fmtPrice(totalDueSum)}
                    readOnly
                  />
                </div>

                {/* Note */}
                <Field id="note" label={txt.note} as="textarea" rows={6} />
              </fieldset>

              <div className="mt-2">
                <Button
                  bgVar="var(--color-scx-primary)"
                  fgVar="var(--color-scx-secondary)"
                  disabled={status.sending}
                >
                  <span className="inline-flex items-center gap-2">
                    {status.sending && <Spinner size={16} className="-ml-1" />}
                    {status.sending ? txt.sending : txt.submit}
                    <span aria-hidden className="text-xl leading-none">
                      ›
                    </span>
                  </span>
                </Button>
              </div>

              {status.msg && (
                <p
                  className={`text-sm ${
                    status.ok ? "text-emerald-300" : "text-rose-300"
                  }`}
                  aria-live="polite"
                >
                  {status.msg}
                </p>
              )}
            </form>
          </div>
        </Container>
      </section>

      <Footer />
    </>
  );
}
