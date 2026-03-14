import { useParams } from "react-router-dom";
import { useI18n } from "../i18n/useI18n";
import PageHero from "../components/PageHero";
import Footer from "../components/Footer";
import MetaTags from "../components/MetaTags";

export default function Privates() {
  const { t } = useI18n();
  const { lang } = useParams();
  const prefix = lang ? `/${lang}` : "";

  // Page-scoped copy
  const hero = t("pages.privates.hero", {});
  const imageAlt = t("pages.privates.imageAlt", "Danseurs SCX");

  return (
    <>
      <MetaTags i18nKey="meta.privatelessons" path="/privatelessons" />
      <PageHero
        className="-mt-20"
        sideImageSrc="/images/natalia-zack.jpg"
        imageSrc="/images/katya_zack.jpg" // swap if you have a dedicated privates photo
        imageAlt={imageAlt}
        bandColorVar="var(--color-scx-primary)"
        titleLines={hero.titleLines || ["COURS", "PRIVÉS"]}
        description={
          hero.desc ||
          "Des séances personnalisées pour progresser rapidement, à votre rythme."
        }
        actions={[
          {
            href: `/contact`,
            label: hero.ctaReserve || t("common.buttons.reserve", "Réserver"),
            bgVar: "var(--color-scx-secondary)",
            fgVar: "#fff",
          },
        ]}
      />
      <Footer
        bgVar="var(--color-scx-accent)"
        stripeVar="#22c55e"
        fgVar="#fff"
      ></Footer>

      {/* more sections for this page go here */}
    </>
  );
}
