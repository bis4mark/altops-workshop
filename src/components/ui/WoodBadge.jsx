import { woodByName } from "../../lib/constants";

/** Wood species badge — tone chip + short code, with a grain hint. */
export default function WoodBadge({ species, size = "sm" }) {
  const w = woodByName(species);
  const px = size === "lg" ? 28 : 20;
  return (
    <span
      title={w.name}
      className="inline-flex shrink-0 items-center justify-center overflow-hidden rounded"
      style={{ width: px, height: px, background: w.tone }}
    >
      <svg width={px} height={px} viewBox="0 0 20 20" aria-hidden="true">
        <g stroke="rgba(255,255,255,0.28)" strokeWidth="1" fill="none">
          <path d="M-2 4 C 6 2, 14 6, 22 4" />
          <path d="M-2 10 C 6 8, 14 12, 22 10" />
          <path d="M-2 16 C 6 14, 14 18, 22 16" />
        </g>
        <text
          x="10"
          y="13.5"
          textAnchor="middle"
          fontSize="6.5"
          fontFamily="JetBrains Mono, monospace"
          fontWeight="600"
          fill="rgba(255,255,255,0.92)"
        >
          {w.short}
        </text>
      </svg>
    </span>
  );
}
