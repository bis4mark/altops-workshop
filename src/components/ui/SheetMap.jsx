/* One board sheet drawn to scale: every piece where the packer put it, the
   usable offcuts hatched, so the saw operator can follow it on the floor. */

const short = (name, max = 18) => (name.length > max ? `${name.slice(0, max - 1)}…` : name);

export default function SheetMap({ sheet, width, height, mat }) {
  const hatch = `hatch-${mat}-${sheet.index}`.replace(/[^a-zA-Z0-9-]/g, "");
  const label = Math.max(46, Math.round(height / 16));

  return (
    <figure className="min-w-0">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full rounded border border-line bg-white"
        role="img"
        aria-label={`Sheet ${sheet.index} of ${mat}`}
      >
        <defs>
          <pattern id={hatch} width="60" height="60" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="60" stroke="#d3cfc6" strokeWidth="10" />
          </pattern>
        </defs>

        <rect x="0" y="0" width={width} height={height} fill="#fff" stroke="#8b857c" strokeWidth="6" />

        {sheet.offcuts.map((o, i) => (
          <rect key={`o${i}`} x={o.x} y={o.y} width={o.w} height={o.h} fill={`url(#${hatch})`} stroke="#d3cfc6" strokeWidth="2" />
        ))}

        {sheet.pieces.map((p, i) => (
          <g key={`p${i}`}>
            <rect x={p.x} y={p.y} width={p.w} height={p.h} fill="#e9ddc8" stroke="#5a4a33" strokeWidth="5" />
            {p.w > 380 && p.h > 170 && (
              <text
                x={p.x + p.w / 2}
                y={p.y + p.h / 2}
                fontSize={label}
                fill="#5a4a33"
                textAnchor="middle"
                dominantBaseline="middle"
              >
                {short(p.name)}
              </text>
            )}
            {p.rotated && p.w > 380 && p.h > 170 && (
              <text
                x={p.x + p.w / 2}
                y={p.y + p.h / 2 + label * 1.15}
                fontSize={label * 0.8}
                fill="#8b857c"
                textAnchor="middle"
                dominantBaseline="middle"
              >
                turned
              </text>
            )}
          </g>
        ))}
      </svg>
      <figcaption className="mt-1 flex items-center justify-between text-[11px] text-ink-2">
        <span>Sheet {sheet.index}</span>
        <span className="font-mono">{sheet.pieces.length} pcs</span>
      </figcaption>
    </figure>
  );
}
