// src/components/Button.jsx
export default function Button({
  href,
  children,
  variant = "solid", // "solid" | "outline"
  bgVar = "var(--color-scx-primary)", // pass a var from index.css
  fgVar = "#FFFFFF", // text color var/value (solid only)
  className = "",
  ...props
}) {
  const base =
    "inline-block px-5 py-3 rounded-2xl font-semibold transition-colors focus-visible:outline-none";

  const solid = "bg-[var(--btn-bg)] text-[var(--btn-fg)]";
  const outline =
    "bg-transparent ring-1 ring-[var(--btn-bg)] text-[var(--btn-bg)]";

  const classes = `${base} ${
    variant === "outline" ? outline : solid
  } ${className}`;
  const style = { "--btn-bg": bgVar, "--btn-fg": fgVar };

  const Comp = href ? "a" : "button";
  return (
    <Comp href={href} className={classes} style={style} {...props}>
      {children}
    </Comp>
  );
}
