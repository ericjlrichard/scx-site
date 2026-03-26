// src/pages/Payment.jsx
import { useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { useI18n } from "../i18n/useI18n";
import PageHero from "../components/PageHero";
import Footer from "../components/Footer";
import Container from "../components/Container";
import { classes } from "../data/classes";

const PAYMENTS_URL = import.meta.env.VITE_PAYMENTS_URL; // Apps Script /exec (same as registrations is fine)

export default function Payment() {
  const { t } = useI18n();
  const { lang } = useParams();
  const prefix = lang ? `/${lang}` : "";
  const [sp] = useSearchParams();
  const [creating, setCreating] = useState(false);

  const localeKey = (lang || "fr").startsWith("en") ? "en" : "fr";
  const ids = sp
    .getAll("classId")
    .flatMap((v) => v.split(","))
    .filter(Boolean);
  const items = classes.filter((c) => ids.includes(c.id));

  const hero = t("pages.payment.hero", {});
  const empty = t("pages.payment.empty", {});
  const imageAlt = t("pages.payment.imageAlt", "SCX");
  const totalLabel = t("pages.payment.total", "Total");
  const ctaLabel =
    localeKey === "fr"
      ? "Procéder au paiement Square"
      : "Proceed to Square payment";
  const comingSoon = t(
    "pages.payment.comingSoon",
    localeKey === "fr"
      ? "Le paiement en ligne sera branché sous peu."
      : "Online payment will be hooked up shortly."
  );

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

  const total = items.reduce((s, c) => s + (Number(c.price) || 0), 0);

  async function goToSquare() {
    if (!PAYMENTS_URL) {
      alert("Payments URL not configured.");
      return;
    }
    try {
      setCreating(true);

      // Keep it CORS-simple: use form-encoded POST (no custom headers).
      // We’ll send a single total; server creates one “SCX Classes” line item.
      const form = new URLSearchParams();
      form.set("fn", "createSquarePaymentLink");
      form.set("secret", import.meta.env.VITE_REG_SECRET || "");
      form.set("amountCents", String(Math.round(total * 100)));
      form.set("referenceId", `reg:${ids.join(",")}`);
      form.set(
        "redirectUrl",
        `${window.location.origin}${prefix}/payment/thanks`
      );

      const res = await fetch(PAYMENTS_URL, { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));

      if (data?.ok && data?.url) {
        window.location.href = data.url; // go to Square checkout
      } else {
        console.error("Square link error:", data);
        alert(
          localeKey === "fr"
            ? "Impossible de créer le lien de paiement. Réessayez."
            : "Could not create payment link. Please try again."
        );
      }
    } catch (e) {
      console.error(e);
      alert(
        localeKey === "fr"
          ? "Erreur réseau. Réessayez."
          : "Network error. Please try again."
      );
    } finally {
      setCreating(false);
    }
  }

  return (
    <>
      <title>Payment — Swing ConneXion</title>
      <meta name="robots" content="noindex,nofollow" />
      <PageHero
        className="-mt-20"
        imageSrc="/images/katya_zack.jpg"
        imageAlt={imageAlt}
        bandColorVar="var(--color-scx-primary)"
        titleLines={
          hero.titleLines || (localeKey === "fr" ? ["PAIEMENT"] : ["PAYMENT"])
        }
        description={
          hero.desc ||
          (localeKey === "fr"
            ? "Vérifiez vos éléments et finalisez le paiement."
            : "Review your items and complete payment.")
        }
      />

      <section className="bg-scx-secondary text-white">
        <Container>
          <div className="py-6 md:py-10 grid gap-4 max-w-2xl">
            {!items.length ? (
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-white/90">
                  {empty.message ||
                    (localeKey === "fr"
                      ? "Aucun article à payer. Retournez à l’inscription."
                      : "No items to pay. Go back to registration.")}
                </p>
                <div className="mt-3">
                  <Link
                    to={`${prefix}/register`}
                    className="underline text-white/90 hover:text-white"
                  >
                    {empty.back ||
                      (localeKey === "fr"
                        ? "Retour à l’inscription"
                        : "Back to registration")}
                  </Link>
                </div>
              </div>
            ) : (
              <>
                {/* Items */}
                <div className="rounded-2xl bg-white/5 border border-white/10 divide-y divide-white/10">
                  {items.map((c) => {
                    const loc = c.locale[localeKey] || c.locale.fr;
                    return (
                      <div
                        key={c.id}
                        className="p-4 flex items-start justify-between gap-4"
                      >
                        <div>
                          <div className="font-semibold">{loc.name}</div>
                          <div className="text-sm text-white/80">
                            {fmtDate(c.startDate)}
                          </div>
                        </div>
                        <div className="font-semibold shrink-0">
                          {fmtPrice(c.price)}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Total */}
                <div className="flex items-center justify-between rounded-2xl bg-white/10 p-4">
                  <div className="font-semibold">{totalLabel}</div>
                  <div className="text-lg font-extrabold">
                    {fmtPrice(total)}
                  </div>
                </div>

                {/* Preferred payment methods */}
                <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                  <h3 className="font-extrabold">
                    {t(
                      "pages.payment.pref.title",
                      "Preferred modes of payment"
                    )}
                  </h3>
                  <p className="mt-2 text-white/90">
                    {t(
                      "pages.payment.pref.intro",
                      "In full transparency, we’d rather give back to the community than pass on card processing fees. In that spirit, here are our preferred modes of payment."
                    )}
                  </p>
                  <ul className="mt-3 list-disc pl-5 space-y-1 text-white/90">
                    <li>
                      {t(
                        "pages.payment.pref.rbc",
                        "Direct transfer to finances.scx@gmail.com (for RBC clients)"
                      )}
                    </li>
                    <li>
                      {t(
                        "pages.payment.pref.interac",
                        "Interac e-Transfer to finances.scx@gmail.com (Autodeposit preferred)"
                      )}
                    </li>
                    <li>
                      {t(
                        "pages.payment.pref.cash",
                        "Cash on your first class (please arrive early)"
                      )}
                    </li>
                    <li>
                      {t(
                        "pages.payment.pref.square",
                        "Square (click on Proceed to Square Payment)"
                      )}
                    </li>
                  </ul>
                </div>

                {/* Square CTA */}
                <button
                  onClick={goToSquare}
                  disabled={creating}
                  className="mt-2 rounded-2xl px-5 py-3 font-semibold bg-[var(--color-scx-primary)] text-[var(--color-scx-secondary)] disabled:opacity-60"
                >
                  {creating
                    ? localeKey === "fr"
                      ? "Création du lien…"
                      : "Creating link…"
                    : ctaLabel}
                </button>

                <div className="text-sm text-white/70">{comingSoon}</div>
              </>
            )}
          </div>
        </Container>
      </section>

      <Footer />
    </>
  );
}
