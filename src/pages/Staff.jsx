// src/pages/Staff.jsx
import { useParams } from "react-router-dom";
import { useI18n } from "../i18n/useI18n";
import PageHero from "../components/PageHero";
import StaffCard from "../components/StaffCard";
import { staff } from "../data/staff";
import Footer from "../components/Footer";
import MetaTags from "../components/MetaTags";

export default function Staff() {
  const { t } = useI18n();
  const { lang } = useParams();

  const hero = t("pages.staff.hero", {});

  const titleLines =
    hero?.titleLines || (lang === "fr" ? ["NOTRE", "ÉQUIPE"] : ["OUR", "TEAM"]);
  const desc =
    hero?.desc ||
    (lang === "fr"
      ? "Une équipe de passionné·e·s qui propulsent la scène swing de Montréal."
      : "A passionate crew powering Montréal’s swing scene.");

  return (
    <>
      <MetaTags i18nKey="meta.staff" path="/staff" />
      <PageHero
        className="-mt-25"
        sideImageSrc="/images/lester.jpg"
        imageSrc="/images/maude_michel.jpg"
        imageAlt="Danseurs SCX"
        bandColorVar="var(--color-scx-primary)"
        titleLines={titleLines}
        description={desc}
      />

      <section className="px-4 py-8 md:py-12">
        <div className="mx-auto max-w-6xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {staff
            .slice()
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
            .map((p, idx) => {
              const loc = p.locale?.[lang] || p.locale?.fr || {};
              return (
                <StaffCard
                  key={p.slug}
                  name={p.name}
                  title={loc.title}
                  image={p.image}
                  bio={loc.bio}
                  ctaHref={p.ctaHref}
                  ctaLabel={loc.ctaLabel}
                  defaultOpen={idx === 0} // open the first by default (nice touch on mobile)
                />
              );
            })}
        </div>
      </section>
      <Footer></Footer>
    </>
  );
}
