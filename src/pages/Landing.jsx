// Landing.jsx — Homepage (swingconnexion.com / swingconnexion.com/en)
//
// Layout (top to bottom):
//   1. MercredisSwingEvent  — temporary promo banner (auto-hides after its expiry date)
//   2. Hero section         — full-screen background photo + promo image + signup CTA
//   3. UpcomingCalendar     — live class grid fetched from the API
//   4. Footer
//
// Routing: served at "/" (no lang) and "/:lang" (e.g. "/en").
// `prefix` builds locale-aware internal links (/fr/signup vs /signup).

import { useState, useEffect } from "react";
import Button from "../components/Button";
import { useI18n } from "../i18n/useI18n";
import { useParams, Link } from "react-router-dom";
import Footer from "../components/Footer";
import UpcomingCalendar from "../components/UpcomingCalendar";
import MetaTags from "../components/MetaTags";
import MercredisSwingEvent from "../components/MercredisSwingEvent";
import SplashCarousel from "../components/SplashCarousel";

// Google structured data for SEO — helps search engines show rich results (address, phone, etc.)
const SCHEMA = {
  "@context": "https://schema.org",
  "@type": ["LocalBusiness", "DanceSchool"],
  "name": "Swing ConneXion",
  "url": "https://swingconnexion.com",
  "logo": "https://swingconnexion.com/logos/SCX_rond_bleu.png",
  "image": "https://swingconnexion.com/images/meta_splash.png",
  "description": "Swing dance school in Montreal offering group classes, private lessons, weekly intro classes, and performance troupes.",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "1483 Avenue du Mont-Royal, 3e étage",
    "addressLocality": "Montréal",
    "addressRegion": "QC",
    "postalCode": "H2J 1Z5",
    "addressCountry": "CA"
  },
  "telephone": "+15148064121",
  "email": "info@swingconnexion.com",
  "priceRange": "$$",
  "currenciesAccepted": "CAD",
  "paymentAccepted": "Cash, Interac, Credit Card",
  "areaServed": { "@type": "City", "name": "Montréal" },
  "sameAs": [
    "https://www.facebook.com/swingconnexion",
    "https://www.instagram.com/swingconnexion",
    "https://www.facebook.com/mercredisswing"
  ]
};

export default function Landing() {
  const { t } = useI18n();
  const { lang } = useParams();
  const prefix = lang ? `/${lang}` : "";
  const locale = lang === "en" ? "en" : "fr";

  // `is_pass` classes get their own quick-signup buttons in the hero (skips class-picker step in SignUp)
  const [passes, setPasses] = useState([]);
  useEffect(() => {
    fetch("https://api.swingconnexion.com/public/classes")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setPasses(data.filter((c) => c.is_pass)); })
      .catch(() => {});
  }, []);

  return (
    <>
      <MetaTags i18nKey="meta.landing" path="/" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(SCHEMA) }} />

      <MercredisSwingEvent locale={locale} />

      {/* -mt-25 pulls the hero up so it visually overlaps the MercredisSwingEvent banner.
          When the event is hidden (past expiry), the negative margin creates extra breathing room above the hero. */}
      <section className="relative isolate -mt-25">
        {/* Background image + overlay */}
        <div className="absolute inset-0 -z-10">
          <img
            src="/images/katya_zack.jpg"
            alt="Danseurs Swing ConneXion"
            className="h-full w-full object-cover"
            fetchPriority="high"
          />
          <div className="absolute inset-0 bg-black/35" aria-hidden />
        </div>

        {/* Content — pt-24 clears the sticky nav bar on all screen sizes.
            The section is pulled up ~100px by -mt-25, so without this padding the top
            of the promo image sits behind the nav rather than below it. */}
        <div className="min-h-[100dvh] flex flex-col items-center text-center px-4 pt-24">
          {/* Homepage splash(es) — admin-managed via Dome, auto-rotates when more than one is active */}
          <SplashCarousel lang={lang} />

          {/* CTA + Calendar block near bottom */}
          <div className="mt-auto w-full max-w-6xl pb-[6vh]">
            <div className="mx-auto max-w-screen-sm">
              <h2 className="heading-hero mt-6 md:mt-8 lg:mt-10">
                {t("pages.landing.heroTitle")}
              </h2>

              <div className="mt-4 flex justify-center">
                <Button
                  to={`${prefix}/signup`}
                  bgVar="var(--color-scx-secondary)"
                  fgVar="#fff"
                >
                  {t("pages.landing.cta")}
                </Button>
              </div>
            </div>

            {/* Pass CTA buttons — one per active pass */}
            {passes.length > 0 && (
              <div className="mt-4 flex flex-wrap justify-center gap-3">
                {passes.map((pass) => (
                  <Link
                    key={pass.id}
                    to={`${prefix}/signup?class=${pass.id}`}
                    className="rounded-full px-6 py-2.5 text-sm font-semibold border border-white/40 text-white hover:bg-white/10 transition-colors"
                  >
                    {pass.name?.[locale] || pass.name?.fr || pass.name?.en}
                  </Link>
                ))}
              </div>
            )}

            {/* Calendar inside same block, AFTER CTA */}
            <div id="schedule" className="mt-8">
              <UpcomingCalendar />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
