import { STATUS } from "../lib/constants";

/** Shared control class — a frosted input. Defined in index.css. */
export const inputCls = "field";

const BADGE_BG = {
  quote: "bg-quote",
  progress: "bg-progress",
  done: "bg-done",
  delivered: "bg-delivered",
};

export function Stat({ value, label, tone = "text-oak" }) {
  return (
    <div className="glass rounded-xl p-3.5">
      <div className={`font-display text-[22px] font-extrabold ${tone}`}>{value}</div>
      <div className="mt-0.5 text-xs text-ink-soft">{label}</div>
    </div>
  );
}

export function Badge({ status }) {
  const s = STATUS[status] || STATUS.quote;
  return (
    <span className={`rounded-[10px] px-2 py-0.5 text-[11px] font-bold text-white ${BADGE_BG[s.color]}`}>
      {s.label}
    </span>
  );
}

export function Dot({ on, label }) {
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] ${on ? "text-done" : "text-ink-soft/70"}`}>
      <span className={`inline-block h-[7px] w-[7px] rounded-full ${on ? "bg-done" : "bg-line"}`} />
      {label}
    </span>
  );
}

export function Field({ label, children, full }) {
  return (
    <label className={`flex flex-col gap-1 ${full ? "col-span-full" : ""}`}>
      <span className="text-xs text-ink-soft">{label}</span>
      {children}
    </label>
  );
}
