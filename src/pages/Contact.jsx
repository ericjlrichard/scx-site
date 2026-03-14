// src/pages/Contact.jsx
import { useParams, useSearchParams } from "react-router-dom";
import { useI18n } from "../i18n/useI18n";
import Container from "../components/Container";
import Button from "../components/Button";
import Footer from "../components/Footer";
import MetaTags from "../components/MetaTags";

import emailjs from "@emailjs/browser";

const EMAILJS = {
  PUBLIC_KEY: import.meta.env.VITE_EMAILJS_PUBLIC_KEY,
  SERVICE_ID: import.meta.env.VITE_EMAILJS_SERVICE_ID,
  TEMPLATE_ADMIN: import.meta.env.VITE_EMAILJS_TEMPLATE_ADMIN,
  TEMPLATE_REPLY: import.meta.env.VITE_EMAILJS_TEMPLATE_REPLY,
};

emailjs.init(EMAILJS.PUBLIC_KEY);

export default function Contact() {
  const { t } = useI18n();
  const { lang } = useParams();
  const [sp] = useSearchParams();
  const prefix = lang ? `/${lang}` : "";

  const hero = t("pages.contact.hero", {});
  const form = t("pages.contact.form", {});

  // Subject: from query (?subject=...), fallback to localized “Private lesson request”

  const subject = lang === "en" ? "Contact SCX" : "Contacter SCX";
  //const subject =
  //  sp.get("subject") ||
  //  (lang === "en" ? "Private lesson request" : "Demande de cours privé");

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const values = Object.fromEntries(formData.entries());

    // 1) Send to admin (include subject)
    emailjs
      .send(
        EMAILJS.SERVICE_ID,
        EMAILJS.TEMPLATE_ADMIN,
        {
          subject, // <-- used in EmailJS template subject/body
          name: values.name,
          firstname: values.firstname,
          email: values.email,
          message: values.message,
        },
        EMAILJS.PUBLIC_KEY
      )
      .then(() => {
        console.log("Message sent to SCX");

        // 2) Auto-reply to sender (optional: include subject in body)
        return emailjs.send(
          EMAILJS.SERVICE_ID,
          EMAILJS.TEMPLATE_REPLY,
          {
            to_name: `${values.firstname} ${values.name}`,
            subject,
            email: values.email,
          },
          EMAILJS.PUBLIC_KEY
        );
      })
      .then(() => {
        //alert("Message auto-reply envoyé ! / Message sent!");
        e.target.reset();
      })
      .catch((err) => {
        console.error("EmailJS error", err);
        alert("Erreur lors de l’envoi du message.");
      });
  };

  return (
    <>
      {/* HERO — image with big white heading on top-left */}
      <MetaTags i18nKey="meta.contact" path="/contact" />

      <section className="relative isolate -mt-25">
        <img
          src="/images/montreal-map-mobile.png"
          alt={t(
            "pages.contact.imageAlt",
            "Carte de Montréal derrière le titre"
          )}
          className="absolute inset-0 h-[46vh] md:h-[54vh] w-full object-cover"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-black/25" />
        <div className="relative h-[46vh] md:h-[54vh] flex items-start">
          <Container>
            <h1 className="text-white font-extrabold leading-[0.95] pt-10 md:pt-14 text-[38px] md:text-[64px] tracking-tight drop-shadow-sm">
              {hero.titleTop || "CONTACTEZ"}
              <br className="hidden md:block" /> {hero.titleBottom || "NOUS"}
            </h1>
          </Container>
        </div>
      </section>

      {/* BODY — dark band with intro, studio card, and form */}
      <section className="bg-scx-secondary text-white">
        <Container>
          <div className="py-6 md:py-10">
            {/* Intro text */}
            <p className="text-[14px] md:text-[15px] text-white/90 max-w-prose">
              {t(
                "pages.contact.intro",
                "Nous sommes curieux de faire votre connaissance. Écrivez-nous ou appelez-nous si vous avez des questions ou des commentaires sur notre école."
              )}
            </p>

            {/* Subject line (from query) */}
            {subject && (
              <div className="mt-3 inline-block rounded-2xl bg-white/10 px-4 py-2 text-[14px] md:text-[15px]">
                {subject}
              </div>
            )}

            {/* Studio card */}
            <div className="mt-4 md:mt-6">
              <div className="inline-block rounded-2xl bg-white/5 px-4 py-4 md:px-5 md:py-5">
                <h3 className="font-extrabold text-[20px] md:text-[22px]">
                  {t("pages.contact.studio.title", "Le Studio")}
                </h3>
                <p className="mt-1 text-[14px] md:text-[15px] text-white/90 whitespace-pre-line">
                  {t(
                    "pages.contact.studio.address",
                    "1483 avenue Mont-Royal, 3e étage\n514.806.4121\ninfo@swingconnexion.com"
                  )}
                </p>
              </div>
            </div>

            {/* Form */}
            <form
              className="mt-6 md:mt-8 grid gap-3 max-w-xl"
              onSubmit={handleSubmit}
            >
              <Field id="firstname" label={form.firstName || "prénom"} />
              <Field id="name" label={form.name || "nom"} />
              <Field id="email" label={form.email || "courriel"} type="email" />
              <Field
                id="message"
                label={form.message || "message"}
                as="textarea"
                rows={6}
              />

              {/* Hidden subject field (for debugging or template use) */}
              <input type="hidden" name="subject" value={subject} />

              <div className="mt-2">
                <Button bgVar="var(--color-scx-primary)" fgVar="#fff">
                  <span className="inline-flex items-center gap-2 cursor-pointer">
                    {form.submit || "Envoyer"}
                    <span aria-hidden className="text-xl leading-none">
                      ›
                    </span>
                  </span>
                </Button>
              </div>
            </form>
          </div>
        </Container>
      </section>
      <Footer />
    </>
  );
}

/* ------- tiny internal field helper ------- */
function Field({ id, label, as = "input", type = "text", rows = 3 }) {
  const Tag = as;

  return (
    <label
      htmlFor={id}
      className="block text-[12px] uppercase tracking-wide text-white/80"
    >
      {label}
      <Tag
        id={id}
        name={id}
        type={as === "input" ? type : undefined}
        rows={as === "textarea" ? rows : undefined}
        className="mt-1 w-full rounded-2xl bg-white/10 border border-white/10 px-4 py-3 text-white placeholder-white/50 outline-none focus:ring-2 focus:ring-white/30"
      />
    </label>
  );
}
