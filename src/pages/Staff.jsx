import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useI18n } from "../i18n/useI18n";
import PageHero from "../components/PageHero";
import StaffCard from "../components/StaffCard";
import Footer from "../components/Footer";
import MetaTags from "../components/MetaTags";

const API = "https://api.swingconnexion.com/public";
const PRIVATE_LINK = "https://square.link/to/private-lessons";

export default function Staff() {
  const { t } = useI18n();
  const { lang } = useParams();

  const [staffList, setStaffList] = useState([]);
  const [template, setTemplate] = useState(null);

  useEffect(() => {
    fetch(`${API}/teachers`)
      .then((r) => r.json())
      .then(({ staff, template }) => {
        setStaffList(staff || []);
        setTemplate(template || null);
      })
      .catch(() => {});
  }, []);

  const hero = t("pages.staff.hero", {});
  const titleLines =
    hero?.titleLines || (lang === "fr" ? ["NOTRE", "ÉQUIPE"] : ["OUR", "TEAM"]);
  const desc =
    hero?.desc ||
    (lang === "fr"
      ? "Une équipe de passionné·e·s qui propulsent la scène swing de Montréal."
      : "A passionate crew powering Montréal's swing scene.");

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
          {staffList.map((person, idx) => {
            const isFr = lang !== "en";
            const title = isFr
              ? (person.title_fr || template?.title_fr || "")
              : (person.title_en || template?.title_en || "");
            const bio = isFr
              ? (person.bio_fr || template?.bio_fr || "")
              : (person.bio_en || template?.bio_en || "");
            const ctaLabel = person.book_private
              ? (isFr ? "Réserver un cours privé" : "Book a private lesson")
              : null;

            return (
              <StaffCard
                key={person.idteachers}
                name={`${person.first_name} ${person.last_name}`}
                title={title}
                image={person.image_url || template?.image_url || ""}
                bio={bio}
                ctaLabel={ctaLabel}
                ctaHref={PRIVATE_LINK}
                defaultOpen={idx === 0}
              />
            );
          })}
        </div>
      </section>
      <Footer />
    </>
  );
}
