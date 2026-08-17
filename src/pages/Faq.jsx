// Faq.jsx — public FAQ page (/faq), grouped by category, admin-managed via Dome.
// Content is fetched from the API (like SplashCarousel.jsx), not baked into
// local i18n JSON, since it's admin-editable dynamic data.

import { useEffect, useState } from "react";
import { useI18n } from "../i18n/useI18n";
import Container from "../components/Container";
import Footer from "../components/Footer";
import MetaTags from "../components/MetaTags";

const API = "https://api.swingconnexion.com/public";

export default function Faq() {
  const { t, lang } = useI18n();
  const [faqs, setFaqs] = useState([]);
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    fetch(`${API}/faq`)
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setFaqs(data); })
      .catch(() => {});
  }, []);

  // Group by category, preserving the server's category + entry sort_order.
  // Uses a Map, not a plain object — object keys that look like integers
  // (e.g. "3", "4") are always enumerated in ascending numeric order by JS,
  // which would silently reorder categories by ID instead of sort_order.
  const grouped = faqs.reduce((acc, f) => {
    const key = f.idfaq_categories ?? "other";
    if (!acc.has(key)) {
      acc.set(key, {
        label: lang === "en"
          ? (f.category_name_en || "Other")
          : (f.category_name_fr || "Autre"),
        items: [],
      });
    }
    acc.get(key).items.push(f);
    return acc;
  }, new Map());

  return (
    <>
      <MetaTags i18nKey="meta.faq" path="/faq" />

      <section className="bg-scx-secondary pt-10 md:pt-14 pb-4 md:pb-6">
        <Container>
          <h1 className="text-white font-extrabold leading-[0.95] text-[38px] md:text-[64px] tracking-tight">
            FAQ
          </h1>
        </Container>
      </section>

      <section className="bg-scx-secondary text-white">
        <Container>
          <div className="py-6 md:py-10">
            {[...grouped.values()].map((group) => (
              <div key={group.label} className="mb-8">
                <h2 className="inline-block rounded-xl bg-[var(--color-scx-primary)] text-white font-extrabold px-4 py-2 mb-3 text-lg md:text-xl">
                  {group.label}
                </h2>
                {group.items.map((f) => {
                  const q = lang === "en" ? f.question_en : f.question_fr;
                  const a = lang === "en" ? f.answer_en : f.answer_fr;
                  const isOpen = openId === f.idfaq;
                  return (
                    <div key={f.idfaq} className="border-b border-white/10 py-3">
                      <button
                        type="button"
                        onClick={() => setOpenId(isOpen ? null : f.idfaq)}
                        aria-expanded={isOpen}
                        className="w-full text-left flex items-center justify-between gap-4 font-medium text-[15px] md:text-[16px]"
                      >
                        <span>{q}</span>
                        <span aria-hidden className="text-xl leading-none shrink-0">
                          {isOpen ? "−" : "+"}
                        </span>
                      </button>
                      {isOpen && (
                        <p className="mt-2 text-[14px] md:text-[15px] text-white/80 whitespace-pre-line">
                          {a}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </Container>
      </section>
      <Footer />
    </>
  );
}
