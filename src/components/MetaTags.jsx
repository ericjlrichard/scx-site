import { useParams } from "react-router-dom";
import { useI18n } from "../i18n/useI18n";

/**
 * Reusable meta tag helper for React 19+
 * - i18nKey: path to { title, desc, tags?, image? } in your i18n files
 * - path: canonical path for this page (e.g., "/contact")
 * - image: optional override for og image (absolute URL recommended)
 * - extra: optional React nodes to inject extra <meta> or <link> tags
 *
 * Usage:
 *   <MetaTags i18nKey="meta.contact" path="/contact" />
 */
export default function MetaTags({ i18nKey, path, image, extra = null, noindex = false }) {
  const { t } = useI18n();
  const { lang } = useParams();
  const prefix = lang ? `/${lang}` : "";

  const meta = t(i18nKey, {});
  const title = meta?.title || "Swing ConneXion";
  const desc = meta?.desc || "Swing dance school in Montreal.";
  const tags = meta?.tags || "SwingConnexion, MontrealSwing, SCX";

  const origin =
    import.meta.env.VITE_SITE_ORIGIN || "https://www.swingconnexion.com";
  const url = `${origin}${prefix}${path || ""}`;

  // Prefer absolute image URLs for scrapers
  const img = image || meta?.image || `${origin}/images/social-thumbnail.jpg`;

  // Hreflang: canonical FR = no prefix, EN = /en/
  const hrefFr = `${origin}${path || ""}`;
  const hrefEn = `${origin}/en${path || ""}`;

  return (
    <>
      {/* React 19 hoists these into <head> automatically */}
      <title>{title}</title>
      <link rel="canonical" href={url} />
      <meta name="description" content={desc} />
      <meta name="keywords" content={tags} />
      {noindex && <meta name="robots" content="noindex,nofollow" />}

      {/* Hreflang language alternates */}
      <link rel="alternate" hrefLang="fr" href={hrefFr} />
      <link rel="alternate" hrefLang="en" href={hrefEn} />
      <link rel="alternate" hrefLang="x-default" href={hrefFr} />

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={desc} />
      <meta property="og:image" content={img} />
      <meta property="og:url" content={url} />
      <meta property="og:locale" content={lang === "en" ? "en_CA" : "fr_CA"} />
      <meta property="og:locale:alternate" content={lang === "en" ? "fr_CA" : "en_CA"} />
      <meta property="og:site_name" content="Swing ConneXion" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={img} />

      {/* Optional extras */}
      {extra}
    </>
  );
}
