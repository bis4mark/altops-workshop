/* One board sheet drawn to scale: every piece where the packer put it, the
   usable offcuts hatched, so the saw operator can follow it on the floor.
   
   Optional: overlay the cabinet's footprint (W × D) as a translucent outline,
   so fabricators see how the pieces relate to the final product dimensions. */

const short = (name, max = 18) => (name.length > max ? `${name.slice(0, max - 1)}…` : name);

export default function SheetMap({ sheet, width, height, mat, cabinetW, cabinetD }) {
  const hatch = `hatch-${mat}-${sheet.index}`.replace(/[^a-zA-Z0-9-]/g, "");
  const label = Math.max(46, Math.round(height / 16));
  
  // If cabinet dimensions are provided, draw the footprint outline and dimensions
  const showFootprint = cabinetW && cabinetD;
  const footprintStroke = "#d97706";
  const footprintOpacity = 0.15;
  const dimLineStroke = "#b45309";
  const dimLineWidth = 2.5;
  const dimFontSize = Math.max(12, Math.round(height / 60));

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

        {showFootprint && (
          <g opacity={footprintOpacity}>
            {/* Cabinet footprint outline */}
            <rect
              x="20"
              y="20"
              width={cabinetW}
              height={cabinetD}
              fill="none"
              stroke={footprintStroke}
              strokeWidth="4"
              strokeDasharray="12 8"
            />

            {/* Width dimension line (top) */}
            <line x1="20" y1="8" x2={20 + cabinetW} y2="8" stroke={dimLineStroke} strokeWidth={dimLineWidth} />
            <line x1="20" y1="2" x2="20" y2="14" stroke={dimLineStroke} strokeWidth={dimLineWidth} />
            <line x1={20 + cabinetW} y1="2" x2={20 + cabinetW} y2="14" stroke={dimLineStroke} strokeWidth={dimLineWidth} />
            <text
              x={20 + cabinetW / 2}
              y="-4"
              fontSize={dimFontSize}
              fill={dimLineStroke}
              textAnchor="middle"
              dominantBaseline="middle"
              fontWeight="bold"
            >
              W: {cabinetW}mm
            </text>

            {/* Depth dimension line (left) */}
            <line x1="-8" y1="20" x2="-8" y2={20 + cabinetD} stroke={dimLineStroke} strokeWidth={dimLineWidth} />
            <line x1="-14" y1="20" x2="-2" y2="20" stroke={dimLineStroke} strokeWidth={dimLineWidth} />
            <line x1="-14" y1={20 + cabinetD} x2="-2" y2={20 + cabinetD} stroke={dimLineStroke} strokeWidth={dimLineWidth} />
            <text
              x="-22"
              y={20 + cabinetD / 2}
              fontSize={dimFontSize}
              fill={dimLineStroke}
              textAnchor="middle"
              dominantBaseline="middle"
              fontWeight="bold"
                   transform={`rotate(-90 -22 ${20 + cabinetD / 2})`}
            >
              D: {cabinetD}mm
            </text>
          </g>
        )}
      </svg>
      <figcaption className="mt-1 flex items-center justify-between text-[11px] text-ink-2">
        <span>Sheet {sheet.index}</span>
        <span className="font-mono">{sheet.pieces.length} pcs</span>
        {showFootprint && <span className="text-amber">Cabinet footprint shown</span>}
      </figcaption>
    </figure>
  );
}
