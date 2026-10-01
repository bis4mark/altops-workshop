/** Bottom-centre toast stack. Auto-dismisses after `ttl` ms; an entry with
 *  `action` stays a beat longer so there's time to actually click Undo. */
export default function ToastHost({ toasts, onDismiss }) {
  if (!toasts.length) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className="pointer-events-auto flex items-center gap-3 rounded-lg border border-line bg-surface px-4 py-2.5
                     text-[13px] text-ink shadow-[0_8px_24px_-8px_rgba(0,0,0,.35)]"
        >
          <span>{t.message}</span>
          {t.action && (
            <button
              onClick={() => {
                t.action.onClick();
                onDismiss(t.id);
              }}
              className="font-semibold text-amber hover:underline"
            >
              {t.action.label}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
