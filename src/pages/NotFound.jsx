// src/pages/NotFound.jsx
import { useParams } from "react-router-dom";
import { useI18n } from "../i18n/useI18n";
import PageHero from "../components/PageHero";
import Container from "../components/Container";
import Footer from "../components/Footer";

export default function NotFound() {
  const { t } = useI18n();
  const { lang } = useParams();
  const prefix = lang ? `/${lang}` : "";

  const hero = t("pages.notFound.hero", {});
  const imageAlt = t("pages.notFound.imageAlt", "Page not found");

  return (
    <>
      <PageHero
        className="-mt-20"
        imageSrc="/images/katya_zack.jpg"
        imageAlt={imageAlt}
        bandColorVar="var(--color-scx-primary)"
        titleLines={hero.titleLines || ["404"]}
        description={
          hero.desc ||
          (lang === "en"
            ? "We couldn’t find this page."
            : "Nous n’avons pas trouvé cette page.")
        }
        actions={[
          {
            href: prefix || "/",
            label:
              t("pages.notFound.ctaHome") ||
              (lang === "en" ? "Back to home" : "Retour à l’accueil"),
            bgVar: "var(--color-scx-secondary)",
            fgVar: "#fff",
          },
          {
            href: `${prefix}/inscription`,
            label:
              t("pages.notFound.ctaRegister") ||
              (lang === "en" ? "Go to registration" : "Aller à l’inscription"),
            variant: "outline",
            bgVar: "var(--color-scx-secondary)",
          },
        ]}
      />

      <section className="bg-scx-secondary text-white">
        <Container>
          <div className="py-8 text-white/90 text-sm">
            {lang === "en"
              ? "If you typed the address, check the spelling. You can also use the menu above."
              : "Si vous avez saisi l’adresse, vérifiez l’orthographe. Vous pouvez aussi utiliser le menu ci-dessus."}
          </div>
        </Container>
      </section>

      <Footer />
    </>
  );
}
