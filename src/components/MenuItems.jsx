import { Link, useParams } from "react-router-dom";
import { useI18n } from "../i18n/useI18n";
import { useState } from "react";

export default function MenuItems({
  className = "",
  itemClassName = "",
  onNavigate,
}) {
  const { t } = useI18n();
  const { lang } = useParams();
  const prefix = lang ? `/${lang}` : "";

  const [open, setOpen] = useState({}); // track open submenus

  const items = [
    {
      kind: "menu",
      label: t("nav.courses"),
      children: [
        {
          kind: "link",
          to: `${prefix}/groupclasses`,
          label: t("nav.groupClasses"),
        },
        {
          kind: "link",
          to: `${prefix}/privatelessons`,
          label: t("nav.privateLessons"),
        },
        {
          kind: "link",
          to: `${prefix}/troupes`,
          label: t("nav.troupes"),
        },
      ],
    },
    {
      kind: "ext",
      href: "https://swingconnexion.square.site/shop/billets-show-20e-anniversaire/RZKZGYZIMSAODGZPP3WN32ER",
      label: t("nav.tickets"),
      newTab: true,
    },
    {
      kind: "menu",
      label: t("nav.staff"),
      children: [
        { kind: "link", to: `${prefix}/staff`, label: t("nav.staff") },
        { kind: "link", to: `${prefix}/codeofconduct`, label: t("nav.codeOfConduct") },
      ],
    },
    { kind: "link", to: `${prefix}/contact`, label: t("nav.contact") },

    { kind: "link", to: `${prefix}/signup`, label: t("nav.register") },
  ];

  const toggle = (label) => {
    setOpen((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <div className={className}>
      {items.map((it) => {
        if (it.kind === "link") {
          return (
            <Link
              key={it.label}
              to={it.to}
              onClick={onNavigate}
              className={itemClassName}
            >
              {it.label}
            </Link>
          );
        }
        if (it.kind === "ext") {
          return (
            <a
              key={it.label}
              href={it.href}
              onClick={onNavigate}
              className={itemClassName}
              target="_blank"
            >
              {it.label}
            </a>
          );
        }
        if (it.kind === "menu") {
          return (
            <div key={it.label}>
              <button
                type="button"
                onClick={() => toggle(it.label)}
                className={`${itemClassName} flex items-center justify-between w-full`}
              >
                <span>{it.label}</span>
                <img
                  src={
                    open[it.label]
                      ? "/icons/SCX_icon_arrow_up_jaune.png"
                      : "/icons/SCX_icon_arrow_down_jaune.png"
                  }
                  alt=""
                  className="h-3 w-3 ml-2"
                />
              </button>
              {open[it.label] && (
                <div className="ml-4 flex flex-col">
                  {it.children.map((child) => (
                    <Link
                      key={child.label}
                      to={child.to}
                      onClick={onNavigate}
                      className={`${itemClassName} text-sm`}
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}
