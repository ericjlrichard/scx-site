import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

/** Context */
const PopupCtx = createContext(null);

/** Provider: wrap your app once */
export function PopupProvider({ children }) {
  const [popup, setPopup] = useState(null); // {mode, title, message, labels, resolve}

  const close = useCallback(
    (result) => {
      if (popup?.resolve) popup.resolve(result);
      setPopup(null);
    },
    [popup]
  );

  const open = useCallback((opts) => {
    return new Promise((resolve) => {
      setPopup({ mode: "alert", ...opts, resolve });
    });
  }, []);

  const alert = useCallback(
    (opts) => open({ ...opts, mode: "alert" }).then(() => {}),
    [open]
  );
  const confirm = useCallback(
    (opts) => open({ ...opts, mode: "confirm" }).then((res) => Boolean(res)),
    [open]
  );

  const value = useMemo(() => ({ alert, confirm }), [alert, confirm]);

  return (
    <PopupCtx.Provider value={value}>
      {children}
      <PopupRenderer popup={popup} onClose={close} />
    </PopupCtx.Provider>
  );
}

/** Hook: use in any component */
export function usePopup() {
  const ctx = useContext(PopupCtx);
  if (!ctx) throw new Error("usePopup must be used within <PopupProvider>");
  return ctx;
}

/** Internal renderer */
function PopupRenderer({ popup, onClose }) {
  const btnRef = useRef(null);
  useEffect(() => {
    if (popup && btnRef.current) btnRef.current.focus();
  }, [popup]);

  useEffect(() => {
    if (!popup) return;
    const onKey = (e) => {
      if (e.key === "Escape")
        onClose(popup.mode === "confirm" ? false : undefined);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [popup, onClose]);

  if (!popup) return null;

  const {
    mode = "alert",
    title = "",
    message = "",
    okText = "OK",
    yesText = "Yes",
    noText = "No",
    // optional: prevent closing by overlay click
    dismissOnOverlay = true,
  } = popup;

  const handleOverlay = () => {
    if (dismissOnOverlay) onClose(mode === "confirm" ? false : undefined);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center px-4"
      aria-modal="true"
      role="dialog"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleOverlay}
      />
      <div className="relative z-[1001] w-full max-w-md rounded-2xl bg-scx-secondary text-white shadow-xl ring-1 ring-white/10">
        <div className="px-5 pt-5">
          {title ? (
            <h2 id="popup-title" className="text-lg md:text-xl font-extrabold">
              {title}
            </h2>
          ) : null}
          {message ? (
            <p className="mt-2 text-white/90 text-sm md:text-[15px]">
              {message}
            </p>
          ) : null}
        </div>

        <div className="px-5 pb-5 pt-4 flex items-center justify-end gap-2">
          {mode === "confirm" ? (
            <>
              <button
                type="button"
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10"
                onClick={() => onClose(false)}
              >
                {noText}
              </button>
              <button
                ref={btnRef}
                type="button"
                className="px-4 py-2 rounded-xl font-bold bg-[var(--color-scx-primary)] text-[var(--color-scx-secondary)] hover:opacity-95"
                onClick={() => onClose(true)}
              >
                {yesText}
              </button>
            </>
          ) : (
            <button
              ref={btnRef}
              type="button"
              className="px-4 py-2 rounded-xl font-bold bg-[var(--color-scx-primary)] text-[var(--color-scx-secondary)] hover:opacity-95"
              onClick={() => onClose()}
            >
              {okText}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
