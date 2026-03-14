// src/components/Header.jsx
import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { useI18n } from "../i18n/useI18n";
import MenuItems from "./MenuItems"; // used for mobile only
import { LangToggle } from "../i18n/useI18n";

export default function Header() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false); // mobile menu
  const [submenu, setSubmenu] = useState(null); // { key, items: [{label,to}] } | null
  const closeTimer = useRef(null);

  const location = useLocation();
  const { lang } = useParams();
  const prefix = lang ? `/${lang}` : "";

  // Esc → close mobile & submenu
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        setSubmenu(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Close mobile on route change
  useEffect(
    () => setOpen(false),
    [location.pathname, location.search, location.hash],
  );

  // Desktop nav config
  const NAV = [
    {
      key: "classes",
      label: t("nav.courses", "Classes"),
      to: `${prefix}/groupclasses`,
      submenu: [
        {
          label: t("nav.introClasses", "Weekly Intro Classes"),
          to: `${prefix}/introclasses`,
        },
        {
          label: t("nav.groupClasses", "Group Classes"),
          to: `${prefix}/groupclasses`,
        },
        {
          label: t("nav.privateLessons", "Private Lessons"),
          to: `${prefix}/privatelessons`,
        },
      ],
    },

    {
      key: "mercredisswing",
      label: t("nav.mercredisswing", "Mercredis Swing"),
      to: `${prefix}/mercredisswing`,
    },

    { key: "staff", label: t("nav.staff", "Our Staff"), to: `${prefix}/staff` },

    {
      key: "contact",
      label: t("nav.contact", "Contact"),
      to: `${prefix}/contact`,
    },

    {
      key: "register",
      label: t("nav.register", "Register"),
      to: `https://swingconnexion.square.site/shop/classes-session-mars-2026/6GONSQ6TUDB6OHUFPX6CMYY5?page=1&limit=30&sort_by=category_order&sort_order=asc`,
    },

    {
      key: "scx20",
      label: t("nav.scx20", "SCX20"),
      to: `https://scx20.swingconnexion.com`,
    },
  ];

  // helpers for hover delay (prevents flicker)
  const openSub = (entry) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    if (entry?.submenu?.length)
      setSubmenu({ key: entry.key, items: entry.submenu });
    else setSubmenu(null);
  };
  const scheduleClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setSubmenu(null), 120);
  };
  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  };

  return (
    <>
      {open && (
        <button
          aria-hidden
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-black/20 md:hidden"
        />
      )}

      <div className="sticky top-0 z-50">
        {/* Side margins: 16px on mobile, 50px on md+ */}
        <div className="pt-4 mx-4 md:mx-[50px] relative">
          {/* Pill */}
          <div
            className="relative rounded-3xl bg-scx-secondary/95 text-white
                       px-4 sm:px-5 md:px-7 lg:px-9
                       py-3.5 md:py-4
                       flex items-center gap-3 md:gap-6
                       ring-1 ring-white/10 shadow-xl backdrop-blur"
            onMouseLeave={scheduleClose}
          >
            {/* Logo */}
            <Link
              to={prefix || "/"}
              className="block shrink-0"
              aria-label="Accueil"
            >
              <img
                src="/logos/SCX_long_jaune.png"
                alt="Swing ConneXion"
                className="h-8 md:h-10 lg:h-12 w-auto object-contain"
              />
            </Link>

            {/* Desktop nav (centered) */}
            <nav className="hidden md:flex flex-1 items-center justify-center text-[15px] md:text-[16px] leading-6">
              <ul className="flex items-center gap-5 lg:gap-7">
                {NAV.map((item) => {
                  const isOpen =
                    submenu?.key === item.key && submenu.items?.length;
                  return (
                    <li
                      key={item.key}
                      onMouseEnter={() => openSub(item)}
                      onFocus={() => openSub(item)}
                    >
                      <Link
                        to={item.to}
                        className={
                          "px-3 py-2 md:px-3.5 md:py-2.5 rounded-xl " +
                          "text-white/90 hover:bg-white/10 focus:outline-none " +
                          "focus-visible:ring-2 focus-visible:ring-white/20 inline-flex items-center gap-2"
                        }
                      >
                        <span>{item.label}</span>
                        {item.submenu?.length ? (
                          <svg
                            aria-hidden
                            viewBox="0 0 20 20"
                            className={
                              "h-4 w-4 transition-transform " +
                              (isOpen ? "rotate-180 opacity-100" : "opacity-80")
                            }
                          >
                            <path
                              fill="currentColor"
                              d="M5.3 7.3a1 1 0 0 1 1.4 0L10 10.6l3.3-3.3a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 0-1.4z"
                            />
                          </svg>
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* Lang toggle (right) */}
            <div className="hidden md:block">
              <LangToggle className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15" />
            </div>

            {/* Hamburger (mobile) */}
            <button
              onClick={() => setOpen((v) => !v)}
              className="md:hidden p-3 ml-auto rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
              aria-expanded={open}
              aria-controls="mobile-menu"
            >
              <span
                aria-hidden
                className={
                  "block h-0.5 w-6 bg-white transition-transform duration-200 " +
                  (open ? "translate-y-1.5 rotate-45" : "")
                }
              />
              <span
                aria-hidden
                className={
                  "mt-1.5 block h-0.5 w-6 bg-white transition-opacity duration-200 " +
                  (open ? "opacity-0" : "opacity-100")
                }
              />
              <span
                aria-hidden
                className={
                  "mt-1.5 block h-0.5 w-6 bg-white transition-transform duration-200 " +
                  (open ? "-translate-y-1.5 -rotate-45" : "")
                }
              />
            </button>

            {/* Mobile dropdown (unchanged) */}
            <nav
              id="mobile-menu"
              className={
                "absolute right-2 top-full mt-2 w-64 rounded-2xl bg-scx-secondary/95 backdrop-blur text-white p-2 shadow-lg ring-1 ring-white/10 md:hidden z-50 origin-top-right transition " +
                (open
                  ? "opacity-100 scale-100"
                  : "pointer-events-none opacity-0 scale-95")
              }
            >
              <MenuItems
                className="flex flex-col"
                itemClassName="block px-4 py-3 rounded-xl hover:bg-white/10"
                onNavigate={() => setOpen(false)}
              />
              <div className="mt-1 px-2" onClick={() => setOpen(false)}>
                <LangToggle className="w-full text-center px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20" />
              </div>
            </nav>
          </div>

          {/* DESKTOP SUBMENU BAR (separate box under pill) */}
          {submenu?.items?.length ? (
            <div
              className="absolute left-0 right-0 top-full mt-2 hidden md:block z-50"
              onMouseEnter={cancelClose}
              onMouseLeave={scheduleClose}
            >
              <div className="rounded-2xl bg-scx-secondary/95 text-white ring-1 ring-white/10 shadow-xl backdrop-blur px-6 py-4">
                <ul className="flex items-center justify-center gap-6">
                  {submenu.items.map((it) => (
                    <li key={it.to}>
                      <Link
                        to={it.to}
                        className="px-4 py-2 rounded-xl hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
                      >
                        {it.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
