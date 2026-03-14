/* ------- compact form components with comfy spacing ------- */

export default function Select({ id, label, options, defaultValue }) {
  return (
    <div className="mb-3 md:mb-4">
      <label
        htmlFor={id}
        className="block text-[12px] uppercase tracking-wide text-white/80"
      >
        {label}
      </label>
      <select
        id={id}
        name={id}
        defaultValue={defaultValue}
        className="mt-1.5 w-full rounded-2xl bg-white/10 border border-white/10 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-white/30"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="text-black">
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
