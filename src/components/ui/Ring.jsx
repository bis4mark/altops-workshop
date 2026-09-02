/** Circular progress ring — Shop Floor Capacity on the dashboard. */
export default function Ring({ value, size = 120, label, sub }) {
  const v = Math.max(0, Math.min(100, value));
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const tone = v >= 100 ? "var(--color-alert)" : v >= 80 ? "var(--color-warn)" : "var(--color-amber)";

  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-sunk)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={tone}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * v) / 100}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="font-mono text-2xl font-bold tabular-nums text-ink">{Math.round(v)}%</span>
        {label && <span className="label mt-0.5">{label}</span>}
        {sub && <span className="mt-0.5 text-[11px] text-ink-2">{sub}</span>}
      </div>
    </div>
  );
}
