import { useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";

/** Centered modal — max 640px per the design rules. */
export default function Modal({ open, title, onClose, children, footer }) {
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
          key="modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : 0.16 }}
          onMouseDown={(e) => e.target === e.currentTarget && onClose()}
        >
          <div className="absolute inset-0 bg-ink/40" />
          <motion.div
            className="card relative flex max-h-[85vh] w-full max-w-[560px] flex-col"
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
            transition={{ duration: reduce ? 0 : 0.18, ease: [0.22, 1, 0.36, 1] }}
          >
            <header className="flex items-center justify-between border-b border-line px-5 py-3.5">
              <h2 className="font-semibold text-ink">{title}</h2>
              <button onClick={onClose} aria-label="Close" className="btn !px-2">
                <X size={15} />
              </button>
            </header>
            <div className="min-h-0 flex-1 overflow-auto px-5 py-4">{children}</div>
            {footer && (
              <footer className="flex items-center justify-end gap-2 border-t border-line px-5 py-3">
                {footer}
              </footer>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
