/* Four-corner picker — the local Measure path, with no model and no network.

   Tap four corners on the reference object, then four on each board. The
   geometry in lib/measureGeometry.js turns those taps into centimetres. It is
   also how labelled data gets collected for free: the taps are exactly the
   quads a detector would have to predict.
*/

import { useMemo, useRef, useState } from "react";
import { MeasurementError, measureBoards, referenceConfidence } from "../../lib/measureGeometry";

const REF_COLOR = "#b45309";
const BOARD_COLOR = "#1d4ed8";

const EMPTY = { ref: [], boards: [], pending: [] };

export default function CornerPicker({ image, reference, onDone, onCancel }) {
  const svgRef = useRef(null);
  const [natural, setNatural] = useState(null);
  const [pick, setPick] = useState(EMPTY);
  const [err, setErr] = useState(null);

  const { ref: refQuad, boards, pending } = pick;
  const onReference = refQuad.length < 4;
  const boardNo = boards.length + 1;

  /* Stroke and marker sizes are in image pixels, because the viewBox is the
     photo's natural size. They have to scale or they vanish on a big photo. */
  const w = natural?.w || 1000;
  const stroke = Math.max(1.5, w / 500);
  const dot = Math.max(3.5, w / 160);
  const font = Math.max(9, w / 55);

  /* One functional update per tap: four fast taps must not each read the same
     stale array and overwrite one another. */
  const addPoint = (e) => {
    const svg = svgRef.current;
    if (!svg || !natural) return;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;

    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
    const pt = [Math.round(p.x * 10) / 10, Math.round(p.y * 10) / 10];
    setErr(null);

    setPick((s) => {
      if (s.ref.length < 4) return { ...s, ref: [...s.ref, pt] };
      if (s.pending.length === 3) {
        return { ...s, boards: [...s.boards, [...s.pending, pt]], pending: [] };
      }
      return { ...s, pending: [...s.pending, pt] };
    });
  };

  const undo = () => {
    setErr(null);
    setPick((s) => {
      if (s.pending.length) return { ...s, pending: s.pending.slice(0, -1) };
      if (s.boards.length) return { ...s, boards: s.boards.slice(0, -1) };
      return { ...s, ref: s.ref.slice(0, -1) };
    });
  };

  const reset = () => {
    setPick(EMPTY);
    setErr(null);
  };

  const measure = () => {
    try {
      const result = measureBoards(
        { quad: refQuad, long_cm: reference.long_cm, short_cm: reference.short_cm },
        boards.map((quad, i) => ({ label: `Board ${i + 1}`, quad })),
        natural.w,
      );
      onDone(result);
    } catch (e) {
      setErr(e instanceof MeasurementError ? e.message : "Could not measure that photo.");
    }
  };

  /* Live confidence, so the user learns the "fill a quarter of the frame" rule
     while they are still holding the phone rather than after the fact. */
  const scale = useMemo(() => {
    if (refQuad.length !== 4 || !natural) return null;
    try {
      return referenceConfidence(refQuad, natural.w, reference.long_cm);
    } catch {
      return null;
    }
  }, [refQuad, natural, reference]);

  const points = (quad, color, prefix) =>
    quad.map(([x, y], i) => (
      <g key={`${prefix}-${i}`}>
        <circle cx={x} cy={y} r={dot} fill={color} stroke="#fff" strokeWidth={stroke / 2} />
        <text
          x={x + dot * 1.6}
          y={y - dot * 1.2}
          fontSize={font}
          fontWeight={700}
          fill="#fff"
          stroke={color}
          strokeWidth={font / 6}
          paintOrder="stroke"
        >
          {i + 1}
        </text>
      </g>
    ));

  const outline = (quad, color, key) => {
    if (quad.length < 2) return null;
    const complete = quad.length === 4;
    return (
      <polygon
        key={key}
        points={quad.map((p) => p.join(",")).join(" ")}
        fill={color}
        fillOpacity={complete ? 0.12 : 0}
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={complete ? undefined : `${stroke * 3} ${stroke * 2}`}
      />
    );
  };

  return (
    <div className="mb-3 rounded-[10px] card p-3">
      <div className="mb-2 text-xs text-ink-2">
        {onReference ? (
          <>
            Tap the <strong className="text-ink">four corners</strong> of the {reference.label}, in
            any order. It must sit in the same plane as the wood.
          </>
        ) : (
          <>
            Tap the <strong className="text-ink">four corners</strong> of board {boardNo}. Add as
            many boards as you need, then measure.
          </>
        )}
      </div>

      <div className="relative overflow-hidden rounded-lg bg-black">
        <img
          src={image}
          alt=""
          className="block w-full select-none"
          onLoad={(e) =>
            setNatural({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })
          }
        />
        {natural && (
          <svg
            ref={svgRef}
            viewBox={`0 0 ${natural.w} ${natural.h}`}
            className="absolute inset-0 h-full w-full cursor-crosshair"
            onClick={addPoint}
          >
            {outline(refQuad, REF_COLOR, "ref")}
            {points(refQuad, REF_COLOR, "ref")}

            {boards.map((quad, i) => (
              <g key={`b-${i}`}>
                {outline(quad, BOARD_COLOR, `bo-${i}`)}
                {points(quad, BOARD_COLOR, `bp-${i}`)}
              </g>
            ))}

            {outline(pending, BOARD_COLOR, "pending")}
            {points(pending, BOARD_COLOR, "pend")}
          </svg>
        )}
      </div>

      {scale && (
        <div
          className={`mt-2 rounded-lg p-2 text-[11px] ${
            scale.confidence === "high" ? "bg-ok/10 text-ink-2" : "bg-alert/10 text-alert"
          }`}
        >
          Reference spans {Math.round(scale.frame_fraction * 100)}% of the frame width —{" "}
          {scale.confidence} confidence, ±{scale.estimated_error_cm} cm per corner.{" "}
          {scale.confidence !== "high" &&
            "Move closer so it fills at least a quarter of the width for a trustworthy number."}
        </div>
      )}

      {err && <div className="mt-2 rounded-lg bg-alert/10 p-2 text-[12px] text-alert">{err}</div>}

      <div className="mt-2 flex flex-wrap gap-2">
        <button
          onClick={measure}
          disabled={refQuad.length !== 4 || !boards.length}
          className="flex-1 rounded-lg bg-ink p-2.5 text-sm font-semibold text-white transition-[filter,transform] hover:brightness-110 active:scale-[0.97] disabled:opacity-40"
        >
          Measure {boards.length ? `${boards.length} board${boards.length > 1 ? "s" : ""}` : ""}
        </button>
        <button
          onClick={undo}
          disabled={!refQuad.length && !boards.length && !pending.length}
          className="rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink disabled:opacity-40"
        >
          Undo
        </button>
        <button
          onClick={reset}
          disabled={!refQuad.length}
          className="rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink disabled:opacity-40"
        >
          Reset
        </button>
        <button onClick={onCancel} className="rounded-lg px-3 py-2.5 text-sm text-ink-2">
          Cancel
        </button>
      </div>
    </div>
  );
}
