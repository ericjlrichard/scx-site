// src/components/Spinner.jsx
export default function Spinner({ size = 18, className = "" }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={`inline-block rounded-full border-2 border-white/30 border-t-white animate-spin ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

export function LoadingOverlay({ show = false, children }) {
  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-[999] bg-black/40 backdrop-blur-sm
                 flex flex-col items-center justify-center px-6 text-center"
    >
      <Spinner size={28} />
      {children ? (
        // Force color with inline style to beat any late-loaded globals
        <p
          className="mt-3 text-sm md:text-base max-w-md font-medium"
          style={{ color: "#fff" }}
        >
          {children}
        </p>
      ) : null}
      <span className="sr-only">Submitting…</span>
    </div>
  );
}
