import { useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";

/** Right-side drawer — the job editor lives in here. Max 620px. */
export default function Drawer({ open, title, subtitle, onClose, children, footer }) {
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="drawer"
          className="fixed inset-0 z-50 flex justify-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : 0.18 }}
        >
          <div className="absolute inset-0 bg-ink/30" onMouseDown={onClose} />
          <motion.aside
            className="relative flex h-full w-full max-w-[620px] flex-col border-l border-line bg-canvas"
            initial={{ x: reduce ? 0 : "100%" }}
            animate={{ x: 0 }}
            exit={{ x: reduce ? 0 : "100%" }}
            transition={{ duration: reduce ? 0 : 0.26, ease: [0.22, 1, 0.36, 1] }}
          >
            <header className="flex shrink-0 items-start justify-between border-b border-line px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-ink">{title}</h2>
                {subtitle && <p className="mt-0.5 text-xs text-ink-2">{subtitle}</p>}
              </div>
              <button onClick={onClose} aria-label="Close" className="btn !px-2">
                <X size={15} />
              </button>
            </header>
            <div className="min-h-0 flex-1 overflow-auto px-5 py-4">{children}</div>
            {footer && (
              <footer className="flex shrink-0 items-center justify-between gap-2 border-t border-line px-5 py-3">
                {footer}
              </footer>
            )}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
