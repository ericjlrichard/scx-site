import { useState, useEffect, useRef } from "react";
import Container from "./Container";
import { useI18n } from "../i18n/useI18n";

const ZOHO_ID =
  "sf3z33cbb93503dd9abc0681150ddaa4e31a8e45dd8f1a693ac8e2d5b810a52c4cf2";

export default function Footer({
  bgVar = "var(--color-scx-primary)", // orange
  stripeVar = "var(--color-primary)",
  fgVar = "var(--color-scx-secondary)",
  className = "",
}) {
  const [logoSrc, setLogoSrc] = useState("/logos/SCX_rond_bleu.png");
  const { t } = useI18n();
  const year = new Date().getFullYear();
  const zohoHostRef = useRef(null);

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

  // Try official Zoho init; fallback to plain form if script blocked.
  useEffect(() => {
    const host = zohoHostRef.current;
    if (!host) return;

    // create placeholder container for Zoho injection
    host.innerHTML = `
      <div id="${ZOHO_ID}" data-type="signupform" style="opacity:0;"></div>
      <img src="https://zvc-zgp.maillist-manage.ca/images/spacer.gif" style="display:none;" />
    `;

    let tries = 0;
    const maxTries = 40; // ~8s
    const interval = setInterval(() => {
      tries++;
      const setup = typeof window !== "undefined" ? window.setupSF : undefined;

      if (typeof setup === "function") {
        try {
          setup(ZOHO_ID, "ZCFORMVIEW", false, "light", false, "0");
        } catch (e) {
          // console.warn("Zoho setup error", e);
        }
      }

      // Did Zoho inject a form?
      const injected = host.querySelector(`#${CSS.escape(ZOHO_ID)} form`);
      if (injected) {
        clearInterval(interval);
      } else if (tries >= maxTries) {
        clearInterval(interval);
        // Fallback: render a simple, direct-post form (no JS required)
        host.innerHTML = `
<div class="quick_form_11_css" name="SIGNUP_BODY" style="background:#0d3b66; width:100%; max-width:520px; border:4px solid #ff605d; border-top-width:4px; color:#fff; padding:14px; border-radius:12px; margin:0 auto;">
  <div style="font-weight:800; font-size:18px; margin-bottom:8px">
    Join Our Newsletter · Se joindre à notre bulletin
  </div>
  <form method="POST" action="https://zvc-zgp.maillist-manage.ca/weboptin.zc" target="_blank" style="display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
    <input type="email" name="CONTACT_EMAIL" required placeholder="Email / Courriel"
      style="flex:1 1 220px; background:transparent; color:#fff; border:0; border-bottom:1px solid #849cb3; padding:6px 8px; outline:none" />
    <input type="text" name="LASTNAME" placeholder="Name / Nom"
      style="flex:1 1 180px; background:transparent; color:#fff; border:0; border-bottom:1px solid #849cb3; padding:6px 8px; outline:none" />
    <button type="submit"
      style="flex:0 0 auto; height:36px; padding:0 14px; background:#ff6161; color:#fff; border:0; border-radius:8px; cursor:pointer; font-weight:700">
      Join / Se joindre
    </button>

    <!-- Required hidden fields from your original snippet -->
    <input type="hidden" name="submitType" value="optinCustomView" />
    <input type="hidden" name="formType" value="QuickForm" />
    <input type="hidden" name="zx" value="1199c9f8528" />
    <input type="hidden" name="zcvers" value="2.0" />
    <input type="hidden" name="oldListIds" value="" />
    <input type="hidden" name="mode" value="OptinCreateView" />
    <input type="hidden" name="zcld" value="" />
    <input type="hidden" name="zctd" value="12aa1efb94e1781" />
    <input type="hidden" name="zc_Url" value="zvc-zgp.maillist-manage.ca" />
    <input type="hidden" name="new_optin_response_in" value="0" />
    <input type="hidden" name="duplicate_optin_response_in" value="0" />
    <input type="hidden" name="zc_trackCode" value="ZCFORMVIEW" />
    <input type="hidden" name="zc_formIx" value="3z33cbb93503dd9abc0681150ddaa4e31a8e45dd8f1a693ac8e2d5b810a52c4cf2" />
    <input type="hidden" name="viewFrom" value="URL_ACTION" />
  </form>
  <div style="font-size:12px; opacity:.8; margin-top:8px">
    We respect your privacy · Nous respectons votre vie privée.
  </div>
</div>`;
      }
    }, 200);

    return () => clearInterval(interval);
  }, []);

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
              <div ref={zohoHostRef} />
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
