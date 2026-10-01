import { useMemo } from "react";
import { buildGeometry3D } from "../../lib/geometry3d";
import { buildTechnicalDrawing } from "../../lib/technicalDrawing";

const MARGIN = 60;
const FONT = 13;

function Dim({ dim }) {
  return (
    <g stroke="#333" strokeWidth={1.5} fill="none">
      <line {...dim.line} />
      {dim.ticks.map((t, i) => (
        <line key={i} {...t} />
      ))}
      <text x={dim.textPos.x} y={dim.textPos.y} fontSize={FONT} fill="#333" stroke="none" textAnchor="middle">
        {dim.text}
      </text>
    </g>
  );
}

function OrthoView({ title, view }) {
  const { minX, minY, maxX, maxY } = view.bounds;
  const vb = `${minX - MARGIN} ${minY - MARGIN} ${maxX - minX + MARGIN * 2} ${maxY - minY + MARGIN * 2}`;
  const h = maxY;
  return (
    <div className="rounded-lg border border-line bg-white p-2">
      <div className="mb-1 text-xs font-semibold text-ink-2">{title}</div>
      <svg viewBox={vb} width="100%" height="260" preserveAspectRatio="xMidYMid meet">
        {view.rects.map((r) => (
          <g key={r.id}>
            <rect
              x={r.x}
              y={h - r.y - r.h}
              width={r.w}
              height={r.h}
              fill="#e9ddc8"
              stroke="#5a4a33"
              strokeWidth={1.5}
            />
            {r.w > 60 && r.h > 20 && (
              <text
                x={r.x + r.w / 2}
                y={h - r.y - r.h / 2}
                fontSize={FONT - 2}
                fill="#5a4a33"
                textAnchor="middle"
                dominantBaseline="middle"
              >
                {r.label}
              </text>
            )}
          </g>
        ))}
        <Dim dim={view.dimH} />
        <Dim dim={view.dimV} />
      </svg>
    </div>
  );
}

function ExplodedView({ exploded }) {
  const { minX, minY, maxX, maxY } = exploded.bounds;
  const vb = `${minX - MARGIN} ${minY - MARGIN} ${maxX - minX + MARGIN * 2} ${maxY - minY + MARGIN * 2}`;
  const shadeFill = { top: "#f0e4cf", left: "#cdb48c", right: "#b89b6e" };
  return (
    <div className="rounded-lg border border-line bg-white p-2">
      <div className="mb-1 text-xs font-semibold text-ink-2">Exploded assembly</div>
      <svg viewBox={vb} width="100%" height="260" preserveAspectRatio="xMidYMid meet">
        {exploded.parts.map((part) => (
          <g key={part.id}>
            {part.faces.map((face, i) => (
              <polygon
                key={i}
                points={face.points.map(([x, y]) => `${x},${y}`).join(" ")}
                fill={shadeFill[face.shade]}
                stroke="#5a4a33"
                strokeWidth={1}
              />
            ))}
          </g>
        ))}
      </svg>
    </div>
  );
}

export default function DrawingsPanel({ j }) {
  const dwg = useMemo(() => {
    if (!j.plan || !j.W || !j.H) return null;
    const geometry = buildGeometry3D(j, j.plan, "bar");
    return buildTechnicalDrawing(j, j.plan, geometry);
  }, [j.plan, j.W, j.H, j.D, j.type, j.species]);

  if (!dwg) {
    return (
      <div className="rounded-lg bg-alert/10 p-3 text-[13px] text-alert">
        Generate a cut plan on the Plan tab first.
      </div>
    );
  }

  return (
    <div className="drawing-sheet">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <OrthoView title="Front view" view={dwg.front} />
        <OrthoView title="Side view" view={dwg.side} />
        <OrthoView title="Top view" view={dwg.top} />
        <ExplodedView exploded={dwg.exploded} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 rounded-lg border border-line p-3 text-[13px] sm:grid-cols-4">
        <div>
          <span className="text-ink-2">Job</span>
          <div className="font-semibold">{j.title || "Untitled"}</div>
        </div>
        <div>
          <span className="text-ink-2">Type / species</span>
          <div className="font-semibold">
            {j.type} · {j.species}
          </div>
        </div>
        <div>
          <span className="text-ink-2">Overall (mm)</span>
          <div className="font-semibold">
            {j.W} × {j.D || "-"} × {j.H}
          </div>
        </div>
        <div>
          <span className="text-ink-2">Date</span>
          <div className="font-semibold">{new Date().toLocaleDateString()}</div>
        </div>
      </div>

      <div className="no-print mt-3">
        <button onClick={() => window.print()} className="rounded-lg bg-amber px-4 py-2 font-bold text-ink">
          Print drawings
        </button>
      </div>
    </div>
  );
}
