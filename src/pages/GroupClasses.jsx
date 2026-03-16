import { useParams } from "react-router-dom";
import { useI18n } from "../i18n/useI18n";
import PageHero from "../components/PageHero";
import Footer from "../components/Footer";
import MetaTags from "../components/MetaTags";

export default function GroupClasses() {
  const { t } = useI18n();
  const { lang } = useParams();
  const prefix = lang ? `/${lang}` : "";

  const hero = t("pages.classes.hero", {});

  return (
    <>
      <MetaTags i18nKey="meta.groupclasses" path="/groupclasses" />

      <PageHero
        className="-mt-25"
        imageSrc="/images/maude_michel.jpg"
        sideImageSrc="/images/feet.jpg"
        imageAlt="Danseurs SCX"
        bandColorVar="var(--color-scx-primary)"
        titleLines={hero.titleLines || ["COURS DE", "GROUPE"]}
        description={
          hero.desc ||
          "Chez Swing ConneXion, nos cours de groupes sont structurés pour permettre à n’importe qui d’apprendre facilement les danses swing."
        }
        actions={[
          {
            to: `${prefix}/signup`,
            label:
              hero.ctaReserve ||
              t("common.buttons.reserve", "Réserver un cours"),
            bgVar: "var(--color-scx-secondary)",
            fgVar: "#fff",
          },
        ].filter(Boolean)}
      />

      <Footer
        bgVar="var(--color-scx-accent)"
        stripeVar="#22c55e"
        fgVar="#fff"
      />
      {/* more sections for this page go here */}
    </>
  );
}
