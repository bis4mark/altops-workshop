/* Small shared pieces — stat tile, progress bar, severity pill,
   deadline chip, empty state, skeleton. */

export function Stat({ label, value, hint, icon: Icon, tone = "text-ink" }) {
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between">
        <span className="label">{label}</span>
        {Icon && <Icon size={15} className="text-ink-3" />}
      </div>
      <div className={`mt-2 font-mono text-[28px] font-bold leading-none tabular-nums ${tone}`}>
        {value}
      </div>
      {hint && <div className="mt-1.5 text-xs text-ink-2">{hint}</div>}
    </div>
  );
}

export function Bar({ pct, tone = "bg-amber" }) {
  const v = Math.max(0, Math.min(100, pct));
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-sunk">
      <div
        className={`h-full rounded-full ${tone} transition-[width] duration-500`}
        style={{ width: `${v}%` }}
      />
    </div>
  );
}

const PILL_TONE = {
  neutral: "bg-sunk text-ink-2",
  amber: "bg-amber/12 text-amber-2",
  ok: "bg-ok/12 text-ok",
  warn: "bg-warn/12 text-warn",
  alert: "bg-alert/12 text-alert",
};
export function Pill({ tone = "neutral", children }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide ${PILL_TONE[tone]}`}
    >
      {children}
    </span>
  );
}

export function Countdown({ days }) {
  if (days === null || days === undefined) {
    return <span className="font-mono text-[11px] text-ink-3">no date</span>;
  }
  const tone = days < 0 ? "alert" : days <= 3 ? "warn" : "neutral";
  const text =
    days < 0 ? `${Math.abs(days)}d over` : days === 0 ? "due today" : `${days}d left`;
  return <Pill tone={tone}>{text}</Pill>;
}

export function Empty({ icon: Icon, title, hint, action, onAction }) {
  return (
    <div className="card flex flex-col items-center gap-2 border-dashed px-6 py-12 text-center">
      {Icon && <Icon size={26} className="text-ink-3" />}
      <div className="font-semibold text-ink">{title}</div>
      {hint && <div className="max-w-[40ch] text-sm text-ink-2">{hint}</div>}
      {action && (
        <button onClick={onAction} className="btn btn-amber mt-2">
          {action}
        </button>
      )}
    </div>
  );
}

export function Skeleton({ className = "h-4 w-full" }) {
  return <div className={`skeleton rounded ${className}`} />;
}

export function Spinner({ className = "h-3.5 w-3.5" }) {
  return (
    <span
      className={`inline-block shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent ${className}`}
    />
  );
}
