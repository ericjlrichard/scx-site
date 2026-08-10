// Footer.jsx — Site-wide footer
// Contains: logo, nav links, social links, and Brevo (Sendinblue) newsletter signup form.
// BREVO_FORM_URLS holds one embed URL per language — Brevo forms aren't bilingual themselves.
// Background / text colors are CSS var props so pages can theme the footer (default: orange bg, blue text).

import { useState } from "react";
import Container from "./Container";
import { useI18n } from "../i18n/useI18n";

// Brevo (Sendinblue) newsletter signup form — one embed per language
const BREVO_FORM_URLS = {
  fr: "https://b0a9cb5a.sibforms.com/v2/serve/MUIFAEELMls9ZdpiSwcUaAFBsmrvkmTKIX50K_DwmRxd1Zko_R7ohd34LlD4Yhe7ncFVjQqMwtw45ai9fjdr6e9KWNFyHHxQAfw_6dzXfjyJyr45IgYQ6aEzmWgINUjBrslAMAF-b8QbPoQAMkLiwxTLCitOjl7dsdISEaub1EDXpv9YOxSZuKEi6JdiEHScAS4fIY0mhujSyduECQ==",
  en: "https://b0a9cb5a.sibforms.com/v2/serve/MUIFAG-JgETgt8jPLu94BcmGUayhszor4xM4CKp813keCEbZ039c_ZpJA369XT31CYGFN9xXk95NC31asvcLLc4mgNAAQHztLf7ARtI1z8x9WXoBtrBLUwa45GYe0V9JD0pX8KJFuFQUPpIfGPDZTI6EzsojkJepyL1x7YyaFzPd9AQsk03voBDGV2a9jLNXTE7MsFwn_FBF0RQXVg==",
};

export default function Footer({
  bgVar = "var(--color-scx-primary)", // orange
  stripeVar = "var(--color-primary)",
  fgVar = "var(--color-scx-secondary)",
  className = "",
}) {
  const [logoSrc, setLogoSrc] = useState("/logos/SCX_rond_bleu.png");
  const { lang } = useI18n();
  const year = new Date().getFullYear();

  const socials = [
    {
      name: "Facebook",
      href: "https://www.facebook.com/SwingConnexion",
      src: "/icons/SCX_icon_fb_bleu.png",
    },
    {
      name: "Instagram",
      href: "https://www.instagram.com/swingconnexion",
      src: "/icons/SCX_icon_ig_bleu.png",
    },
    {
      name: "YouTube",
      href: "https://www.youtube.com/@SwingConnexion",
      src: "/icons/SCX_icon_yt_bleu.png",
    },
  ];

  return (
    <footer className={className}>
      {/* Thin top stripe */}
      <div className="h-1 -mt-2" style={{ background: stripeVar }} />

      {/* Main bar */}
      <div style={{ background: bgVar }}>
        <Container>
          <div
            className="py-8 md:py-10 flex flex-col items-center justify-center gap-6 md:flex-row md:gap-10"
            style={{ color: fgVar }}
          >
            {/* Logo */}
            <img
              src={logoSrc}
              onError={() => setLogoSrc("/logos/SCX_long_jaune.png")}
              alt="Swing ConneXion"
              className="h-20 md:h-28 w-auto object-contain"
              loading="lazy"
            />

            {/* Socials */}
            <nav
              aria-label="Réseaux sociaux"
              className="flex items-center gap-6"
            >
              {socials.map(({ name, href, src }) => (
                <a
                  key={name}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={name}
                  className="opacity-90 hover:opacity-100 transition"
                >
                  <img
                    src={src}
                    alt=""
                    className="h-5 w-5 object-contain"
                    loading="lazy"
                  />
                </a>
              ))}
            </nav>

            {/* Newsletter */}
            <div className="w-full md:w-auto flex justify-center">
              <iframe
                width="540"
                height="500"
                src={BREVO_FORM_URLS[lang]}
                frameBorder="0"
                scrolling="no"
                allowFullScreen
                style={{ display: "block", marginLeft: "auto", marginRight: "auto", maxWidth: "100%" }}
                title="Newsletter signup"
              />
            </div>

            {/* Copyright */}
            <p className="text-sm opacity-90 text-center">
              © {year} Swing ConneXion
            </p>
          </div>
        </Container>
      </div>
    </footer>
  );
}
