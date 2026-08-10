// MercredisSwingEvent.jsx — Temporary promo banner for special Mercredis Swing events
//
// Returns null automatically after EVENT_EXPIRES — no manual removal needed.
// Flip SOLD_OUT to false to re-enable ticket/class purchase links.
// To update for a future event: change EVENT_EXPIRES, SOLD_OUT, CLASS_URL, TICKETS_URL, and PROGRAM content.

// ⚠️  July 2 has passed — this component currently renders nothing.
const EVENT_EXPIRES = new Date("2026-07-02T06:00:00");
const SOLD_OUT = true;

const CLASS_URL = "https://swingconnexion.square.site/product/spirit-moves-the-dancing-body-class-with-raoul-wilke/3EUOM77DO5AIKRC267WIQFBD?cp=true&sa=true&sbp=false&q=false";
const TICKETS_URL = "https://swingconnexion.square.site/product/mercredis-swing-x-swing-riot-special-edition-july-1st/64QE5ZUO3PLTRMQHVQ7KNFTJ?cp=true&sa=true&sbp=false&q=false";

const PROGRAM = {
  fr: [
    { text: "Cours avec Raoul Wilke à 19h", link: CLASS_URL, linkLabel: "Réserver ma place", desc: "Jazz, house et les racines du mouvement — artiste multidisciplinaire déjà acclamé au Montreal Swing Riot." },
    { text: "Soirée de danse avec musique live par le Michaël Srey et Edith Hazel All-Star band" },
    { text: "3 sets de musique live" },
    { text: "Compétition All That Jazz : 4 battle guests — Melofunk, Palomecc, DannyPopping et Edzin. Chacun choisissent un·e danseur·se de jazz pour former une équipe et s'affronter en battle 2 contre 2 sur la musique live! Inscription gratuite sur place, 500$ de prix en argent pour les gagnants!" },
  ],
  en: [
    { text: "A class with Raoul Wilke at 7pm", link: CLASS_URL, linkLabel: "Get your spot", desc: "Jazz, house, and the roots of movement — multidisciplinary artist previously acclaimed at Montreal Swing Riot." },
    { text: "A dance evening with live music by the Michaël Srey & Edith Hazel All-Star Band" },
    { text: "3 live music sets" },
    { text: "All That Jazz competition: 4 guest battlers — Melofunk, Palomecc, DannyPopping, and Edzin — each pick a jazz dancer to form a 2-on-2 team and battle live to the band! Free sign-up on site, $500 cash prize for the winners!" },
  ],
};

const SCHEDULE = {
  fr: [
    ["19h", "Ouverture des portes — dj music"],
    ["20h", "Musique live"],
    ["21h", "All That Jazz prelims (danse sociale continue!)"],
    ["22h", "Battle guest demo"],
    ["22h30", "All That Jazz Final Battle on live music!"],
  ],
  en: [
    ["7:00pm", "Doors open — dj music"],
    ["8:00pm", "Live music starts"],
    ["9:00pm", "All That Jazz prelims (social dancing continues)"],
    ["10:00pm", "Battle guest demo"],
    ["10:30pm", "All That Jazz Final Battle on live music"],
  ],
};

export default function MercredisSwingEvent({ locale }) {
  if (new Date() > EVENT_EXPIRES) return null;

  const isFr = locale !== "en";
  const lang = isFr ? "fr" : "en";

  return (
    <section className="relative overflow-hidden text-white" style={{ background: "#0c0800" }}>
      {/* Radial warm glow top */}
      <div
        className="absolute inset-x-0 top-0 h-96 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(251,146,60,0.18) 0%, transparent 70%)" }}
      />
      {/* Subtle bottom glow */}
      <div
        className="absolute inset-x-0 bottom-0 h-48 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 60% 80% at 50% 110%, rgba(234,179,8,0.10) 0%, transparent 70%)" }}
      />

      {/* Decorative corner stars */}
      <span className="absolute top-6 left-6 text-amber-400/20 text-5xl select-none pointer-events-none">✦</span>
      <span className="absolute top-6 right-6 text-amber-400/20 text-5xl select-none pointer-events-none">✦</span>
      <span className="absolute bottom-6 left-10 text-amber-400/10 text-3xl select-none pointer-events-none">✦</span>
      <span className="absolute bottom-6 right-10 text-amber-400/10 text-3xl select-none pointer-events-none">✦</span>

      <div className="relative max-w-6xl mx-auto px-4 pt-14 pb-36 md:pt-20 md:pb-28">

        {/* Badge */}
        <div className="flex justify-center mb-5">
          <span
            className="inline-flex items-center gap-2 rounded-full px-5 py-1.5 text-xs font-black uppercase tracking-[0.2em] border text-amber-400"
            style={{ borderColor: "rgba(251,191,36,0.4)", background: "rgba(251,191,36,0.08)" }}
          >
            ✦ {isFr ? "À VOS AGENDAS" : "SAVE THE DATE"} ✦
          </span>
        </div>

        {/* Sold out banner */}
        {SOLD_OUT && (
          <div className="flex justify-center mb-4">
            <div
              className="inline-flex items-center gap-3 rounded-2xl px-8 py-3 font-black text-lg uppercase tracking-widest border"
              style={{ background: "rgba(239,68,68,0.15)", borderColor: "rgba(239,68,68,0.5)", color: "#f87171" }}
            >
              <span className="text-2xl leading-none">✕</span>
              {isFr ? "COMPLET" : "SOLD OUT"}
              <span className="text-2xl leading-none">✕</span>
            </div>
          </div>
        )}

        {/* Title */}
        <h2 className="text-center font-black tracking-tight leading-tight text-3xl md:text-5xl mb-1">
          MERCREDI SWING <span style={{ color: "#f59e0b" }}>×</span> SWING RIOT
        </h2>
        <p className="text-center font-bold text-lg md:text-xl mb-6" style={{ color: "#f59e0b" }}>
          {isFr ? "— Édition spéciale !!" : "— Special Edition!!"}
        </p>

        {/* Top ticket CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
          {SOLD_OUT ? (
            <span
              className="inline-flex items-center gap-2 rounded-full px-7 py-3 font-black text-sm opacity-50 line-through"
              style={{ background: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)" }}
            >
              {isFr ? "Acheter des billets — 25$" : "Get tickets — $25"}
            </span>
          ) : (
            <a
              href={TICKETS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full px-7 py-3 font-black text-sm transition-opacity hover:opacity-85"
              style={{ background: "#f59e0b", color: "#0c0800" }}
            >
              {isFr ? "Acheter des billets — 25$" : "Get tickets — $25"}
            </a>
          )}
          <span className="text-xs font-bold" style={{ color: SOLD_OUT ? "#f87171" : "#fbbf24" }}>
            {SOLD_OUT
              ? (isFr ? "Événement complet!" : "Event sold out!")
              : (isFr ? "Places limitées!" : "Limited availability!")}
          </span>
        </div>

        {/* Two-column layout */}
        <div className="grid md:grid-cols-[1fr_1.1fr] gap-10 items-start">

          {/* Poster image */}
          <div
            className="rounded-2xl overflow-hidden shadow-2xl"
            style={{ boxShadow: "0 0 60px rgba(251,146,60,0.2), 0 20px 40px rgba(0,0,0,0.6)", border: "1px solid rgba(251,191,36,0.2)" }}
          >
            <img
              src="/images/ms-july1.jpg"
              alt="Mercredi Swing × Swing Riot — 1er juillet"
              className="w-full object-cover"
            />
          </div>

          {/* Details */}
          <div className="space-y-6">

            {/* Date pill */}
            <div
              className="inline-block rounded-xl px-5 py-3 border"
              style={{ background: "rgba(251,191,36,0.10)", borderColor: "rgba(251,191,36,0.35)" }}
            >
              <p className="font-black text-2xl md:text-3xl leading-tight" style={{ color: "#fbbf24" }}>
                {isFr ? "Mercredi 1er juillet" : "Wednesday, July 1st"}
              </p>
              {isFr && (
                <p className="text-white/50 text-sm mt-0.5">Au Cosy Tango — pour une soirée!</p>
              )}
            </div>

            {/* Intro */}
            <p className="text-white/75 text-sm leading-relaxed">
              {isFr
                ? "Swing ConneXion en collaboration avec Swing Riot vous invite à une soirée spéciale qui célèbre la musique live, le lindy hop et sa connexion unique avec le street dance!"
                : "Swing ConneXion, in collaboration with Swing Riot, invites you to a special evening celebrating live music, lindy hop, and its unique connection with street dance!"}
            </p>

            {/* Program */}
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] mb-3" style={{ color: "#f59e0b" }}>
                {isFr ? "Au programme" : "On the program"}
              </p>
              <ul className="space-y-2.5">
                {PROGRAM[lang].map((item, i) => (
                  <li key={i} className="flex gap-2.5 text-sm text-white/75 leading-relaxed">
                    <span className="shrink-0 mt-0.5" style={{ color: "#f59e0b" }}>✦</span>
                    <span>
                      {item.text}
                      {item.link && !SOLD_OUT && (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold transition-opacity hover:opacity-80"
                          style={{ background: "rgba(251,191,36,0.18)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.35)" }}
                        >
                          {item.linkLabel} →
                        </a>
                      )}
                      {item.desc && (
                        <span className="block mt-1 text-xs text-white/45 leading-relaxed">{item.desc}</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Schedule */}
            <div
              className="rounded-xl p-4"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <p className="text-xs font-black uppercase tracking-[0.18em] mb-3" style={{ color: "#f59e0b" }}>
                {isFr ? "Horaire de la soirée" : "Evening schedule"}
              </p>
              <div className="space-y-2">
                {SCHEDULE[lang].map(([time, desc], i) => (
                  <div key={i} className="flex gap-3 text-sm">
                    <span className="font-bold shrink-0 w-14 tabular-nums" style={{ color: "#fbbf24" }}>{time}</span>
                    <span className="text-white/65">{desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Fundraiser */}
            <div
              className="rounded-xl p-4"
              style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.25)" }}
            >
              <p className="text-xs font-black uppercase tracking-[0.18em] mb-2" style={{ color: "#f87171" }}>
                {isFr ? "Collecte de fonds" : "Fundraiser"}
              </p>
              <p className="text-white/65 text-sm leading-relaxed">
                {isFr
                  ? "Votre contribution à la porte soutient la programmation culturelle de l'ILHC (Montréal, 2–5 juillet). Nous voulons mettre en lumière les communautés et individus noirs de Montréal qui ont créé, porté et transmis la culture jazz et lindy hop."
                  : "Your contribution at the door supports cultural programming presented during ILHC (Montreal, July 2–5). We want to shine a light on the Black communities and individuals of Montreal who created, carried, and passed down the jazz and lindy hop culture we take part in today."}
              </p>
            </div>

            {/* Ticket CTA */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              {SOLD_OUT ? (
                <span
                  className="inline-flex items-center gap-2 rounded-full px-6 py-3 font-black text-sm opacity-50 line-through"
                  style={{ background: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)" }}
                >
                  {isFr ? "Acheter des billets — 25$" : "Get tickets — $25"}
                </span>
              ) : (
                <a
                  href={TICKETS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full px-6 py-3 font-black text-sm transition-opacity hover:opacity-85"
                  style={{ background: "#f59e0b", color: "#0c0800" }}
                >
                  {isFr ? "Acheter des billets — 25$" : "Get tickets — $25"}
                </a>
              )}
              <span className="text-xs font-bold" style={{ color: SOLD_OUT ? "#f87171" : "#fbbf24" }}>
                {SOLD_OUT
                  ? (isFr ? "Événement complet!" : "Event sold out!")
                  : (isFr ? "Places limitées!" : "Limited availability!")}
              </span>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
