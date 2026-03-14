export default function Field({
  id,
  name, // pass null to omit the name attr entirely
  label,
  as = "input",
  type = "text",
  rows = 3,
  placeholder,
  value,
  onChange,
  readOnly,
  disabled,
}) {
  const Tag = as;

  // If name === null, omit the attribute; else default to id
  const finalName = name === null ? undefined : name ?? id;

  // Build props safely; only add optional props when defined
  const props = {
    id,
    ...(finalName !== undefined ? { name: finalName } : {}),
    ...(as === "input" ? { type } : { rows }),
    placeholder,
    readOnly,
    disabled,
    className:
      "mt-1.5 w-full rounded-2xl bg-white/10 border border-white/10 px-4 py-3 text-white placeholder-white/50 outline-none focus:ring-2 focus:ring-white/30",
    ...(value !== undefined ? { value } : {}),
    ...(onChange ? { onChange } : {}),
  };

  return (
    <div className="mb-3 md:mb-4">
      <label
        htmlFor={id}
        className="block text-[12px] uppercase tracking-wide text-white/80"
      >
        {label}
      </label>
      <Tag {...props} />
    </div>
  );
}
