import { useParams } from "react-router-dom";
import { useI18n } from "../i18n/useI18n";
import PageHero from "../components/PageHero";
import Footer from "../components/Footer";
import MetaTags from "../components/MetaTags";

export default function CodeOfConduct() {
  const { t } = useI18n();
  const { lang } = useParams();

  const isFr = lang === "fr" || !lang;

  const titleLines = isFr ? ["CODE DE", "CONDUITE"] : ["CODE OF", "CONDUCT"];
  const desc = isFr
    ? "Notre engagement envers un espace de danse sécuritaire, inclusif et bienveillant."
    : "Our commitment to a safe, inclusive, and welcoming dance space.";

  return (
    <>
      <MetaTags i18nKey="meta.codeofconduct" path="/codeofconduct" />
      <PageHero
        className="-mt-25"
        imageSrc="/images/maude_michel.jpg"
        sideImageSrc="/images/lester.jpg"
        imageAlt="Danseurs SCX"
        bandColorVar="var(--color-scx-primary)"
        titleLines={titleLines}
        description={desc}
      />

      <section className="px-4 py-8 md:py-12">
        <div className="mx-auto max-w-xl">
          <div className="relative w-full" style={{ paddingBottom: "105.4%", height: 0 }}>
            <iframe
              src="https://docs.google.com/presentation/d/e/2PACX-1vQmxLm97SQ_dvPQEQww7Qh3fcjgBrRAvJrJW6sNEe7tZpHh__7IsTt7kON6-VKLuCR42LxECePaXFS5/pubembed?start=true&loop=true&delayms=15000"
              frameBorder="0"
              allowFullScreen
              className="absolute top-0 left-0 w-full h-full rounded-xl"
              title={isFr ? "Code de conduite" : "Code of conduct"}
            />
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
