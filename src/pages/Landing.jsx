import Button from "../components/Button";
import { useI18n } from "../i18n/useI18n";
import { useParams } from "react-router-dom";
import Footer from "../components/Footer";
import UpcomingCalendar from "../components/UpcomingCalendar";
import MetaTags from "../components/MetaTags";

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

  return (
    <>
      <MetaTags i18nKey="meta.landing" path="/" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(SCHEMA) }} />
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

        {/* Content */}
        <div className="min-h-[100dvh] flex flex-col items-center text-center px-4">
          {/* Top logo */}
          <img
            src="/logos/SCX_20_ans_blanc.png"
            alt="20 ans Swing ConneXion"
            className="pointer-events-none select-none opacity-80 mt-[30vh] md:mt-[18vh] lg:mt-[16vh] max-w-[75vw] md:max-w-[55vw] lg:max-w-[700px]"
          />

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

            {/* Calendar inside same block, AFTER CTA */}
            <div className="mt-8">
              <UpcomingCalendar />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
