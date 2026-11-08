/* Browser port of measure/measure_core.py — the geometry half of the local
   Measure feature.

   The detector's only job is to return quads (four corners in pixels): one for
   the reference object, one per board. Everything after that is arithmetic, and
   it lives here so it can be tested without a camera, a dataset or a GPU.

       reference quad + its real size  ->  homography  ->  board quads  ->  cm

   Why a quad and not a bounding box: a phone photo is almost never square-on,
   so the far edge of a board is smaller than the near edge. One pixel-to-cm
   ratio only holds for a fronto-parallel, single-depth scene. Four corners
   define a homography, which removes the perspective, so the ratio is valid
   everywhere on that plane.

   The boards must lie in the same plane as the reference. Nothing here can see
   thickness, because a single top-down view cannot.

   The Python file is the reference implementation and carries the same tests;
   if the two ever disagree on the synthetic scene, this port has drifted.
*/

// A reference smaller than this fraction of the frame width is too coarse to
// trust: at 60 px across an A4's 29.7 cm, one pixel is half a centimetre.
export const HIGH_SPAN = 0.25;
export const MEDIUM_SPAN = 0.1;

// Corner-finding is assumed accurate to about two pixels. That assumption is
// what turns a pixel span into an error bar in centimetres.
export const CORNER_ERROR_PX = 2.0;

export class MeasurementError extends Error {}

/* Real sizes of the references the picker can measure against. A tape measure
   is deliberately absent: its scale is visible but its extent is not a known
   constant, so only the AI path can use that photo. */
export const LOCAL_REFERENCES = {
  "A4 paper (297×210mm)": { long_cm: 29.7, short_cm: 21.0 },
  "Standard brick (215×102mm)": { long_cm: 21.5, short_cm: 10.2 },
  "Credit card (85×54mm)": { long_cm: 8.5, short_cm: 5.4 },
  // a standard 20 cm steel rule is 25 mm wide
  "20cm ruler": { long_cm: 20.0, short_cm: 2.5 },
};

const EPS_AREA = 1e-12;

/* ── 3×3 and 8×8 linear algebra ─────────────────────────────────────────── */

function matMul(A, B) {
  return A.map((row) => B[0].map((_, j) => row.reduce((s, v, k) => s + v * B[k][j], 0)));
}

function matInv(M) {
  const [[a, b, c], [d, e, f], [g, h, i]] = M;
  const A = e * i - f * h;
  const B = -(d * i - f * g);
  const C = d * h - e * g;
  const det = a * A + b * B + c * C;
  if (Math.abs(det) < EPS_AREA) {
    throw new MeasurementError("Those corners are in a straight line — no plane to measure on.");
  }
  return [
    [A / det, -(b * i - c * h) / det, (b * f - c * e) / det],
    [B / det, (a * i - c * g) / det, -(a * f - c * d) / det],
    [C / det, -(a * h - b * g) / det, (a * e - b * d) / det],
  ];
}

/** Gaussian elimination with partial pivoting, for the 8×8 DLT system. */
function solveSquare(A, rhs) {
  const n = rhs.length;
  const M = A.map((row, i) => [...row, rhs[i]]);

  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(M[r][col]) > Math.abs(M[pivot][col])) pivot = r;
    }
    if (Math.abs(M[pivot][col]) < EPS_AREA) {
      throw new MeasurementError("Those corners do not define a plane.");
    }
    [M[col], M[pivot]] = [M[pivot], M[col]];

    for (let r = col + 1; r < n; r++) {
      const factor = M[r][col] / M[col][col];
      if (!factor) continue;
      for (let c = col; c <= n; c++) M[r][c] -= factor * M[col][c];
    }
  }

  const x = new Array(n).fill(0);
  for (let r = n - 1; r >= 0; r--) {
    let sum = M[r][n];
    for (let c = r + 1; c < n; c++) sum -= M[r][c] * x[c];
    x[r] = sum / M[r][r];
  }
  return x;
}

/* ── quads ──────────────────────────────────────────────────────────────── */

function asQuad(quad, what = "A quad") {
  if (!Array.isArray(quad) || quad.length !== 4) {
    throw new MeasurementError(`${what} needs 4 corners as [x, y]; got ${JSON.stringify(quad)}.`);
  }
  return quad.map((p) => {
    if (!Array.isArray(p) || p.length !== 2 || !Number.isFinite(p[0]) || !Number.isFinite(p[1])) {
      throw new MeasurementError(`${what} has a corner that is not an [x, y] pair.`);
    }
    return [p[0], p[1]];
  });
}

/** The four corners in a stable order: clockwise from top-left. */
export function orderQuad(quad) {
  const pts = asQuad(quad);
  const cx = (pts[0][0] + pts[1][0] + pts[2][0] + pts[3][0]) / 4;
  const cy = (pts[0][1] + pts[1][1] + pts[2][1] + pts[3][1]) / 4;
  const sorted = [...pts].sort(
    (p, q) => Math.atan2(p[1] - cy, p[0] - cx) - Math.atan2(q[1] - cy, q[0] - cx),
  );
  let start = 0;
  for (let i = 1; i < 4; i++) {
    if (sorted[i][0] + sorted[i][1] < sorted[start][0] + sorted[start][1]) start = i;
  }
  return [...sorted.slice(start), ...sorted.slice(0, start)];
}

function sideLengths(quad) {
  return quad.map((p, i) => {
    const q = quad[(i + 1) % 4];
    return Math.hypot(q[0] - p[0], q[1] - p[1]);
  });
}

function span(quad) {
  return Math.max(...sideLengths(quad));
}

function aspect(quad) {
  const e = sideLengths(quad);
  const longSide = (e[0] + e[2]) / 2;
  const shortSide = (e[1] + e[3]) / 2;
  if (shortSide <= 0) return 0;
  return longSide / shortSide;
}

/**
 * Put the reference corners in the order the cm rectangle expects.
 *
 * A plain rectangle carries no orientation cue, so the same four points can be
 * matched to the cm rect four ways, and two of those swap its long and short
 * sides — a 41% scale error on A4 that still fits the corners perfectly. The fix
 * is to pick the assignment whose aspect ratio agrees with the real one, which
 * is also what a mirrored or spun camera needs.
 */
export function alignReference(quad, longCm, shortCm) {
  const pts = asQuad(quad);
  const want = longCm / shortCm;
  let best = null;
  for (const winding of [pts, [...pts].reverse()]) {
    for (let shift = 0; shift < 4; shift++) {
      const candidate = [...winding.slice(shift), ...winding.slice(0, shift)];
      const score = Math.abs(Math.log(Math.max(aspect(candidate), 1e-9) / want));
      if (!best || score < best.score) best = { score, quad: candidate };
    }
  }
  return best.quad;
}

/* ── homography ─────────────────────────────────────────────────────────── */

/**
 * Hartley normalisation: centre on the centroid, scale to mean distance √2.
 * Without this the DLT solves a badly conditioned system and the corners come
 * back with visible error at large pixel coordinates.
 */
function normalise(pts) {
  const cx = (pts[0][0] + pts[1][0] + pts[2][0] + pts[3][0]) / 4;
  const cy = (pts[0][1] + pts[1][1] + pts[2][1] + pts[3][1]) / 4;
  const shifted = pts.map(([x, y]) => [x - cx, y - cy]);
  const meanDist =
    shifted.reduce((s, [x, y]) => s + Math.hypot(x, y), 0) / shifted.length;
  const scale = meanDist > 0 ? Math.SQRT2 / meanDist : 1;
  const T = [
    [scale, 0, -scale * cx],
    [0, scale, -scale * cy],
    [0, 0, 1],
  ];
  return [shifted.map(([x, y]) => [x * scale, y * scale]), T];
}

/** 3×3 projective transform taking src corners onto dst corners (DLT). */
export function homography(src, dst) {
  const s = asQuad(src, "homography() src");
  const d = asQuad(dst, "homography() dst");
  const [sn, Ts] = normalise(s);
  const [dn, Td] = normalise(d);

  const A = [];
  const rhs = [];
  for (let k = 0; k < 4; k++) {
    const [x, y] = sn[k];
    const [u, v] = dn[k];
    A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]);
    rhs.push(u);
    A.push([0, 0, 0, x, y, 1, -v * x, -v * y]);
    rhs.push(v);
  }

  const [h11, h12, h13, h21, h22, h23, h31, h32] = solveSquare(A, rhs);
  const Hn = [
    [h11, h12, h13],
    [h21, h22, h23],
    [h31, h32, 1],
  ];

  let H = matMul(matInv(Td), matMul(Hn, Ts));
  const w = H[2][2];
  if (Math.abs(w) > EPS_AREA) H = H.map((row) => row.map((v) => v / w));
  return H;
}

/** Map a list of points through H. Always returns a list. */
export function applyHomography(H, pts) {
  return pts.map(([x, y]) => {
    const w = H[2][0] * x + H[2][1] * y + H[2][2];
    if (Math.abs(w) < EPS_AREA) {
      throw new MeasurementError("A point mapped to infinity — the quad is degenerate.");
    }
    return [
      (H[0][0] * x + H[0][1] * y + H[0][2]) / w,
      (H[1][0] * x + H[1][1] * y + H[1][2]) / w,
    ];
  });
}

/* ── confidence ─────────────────────────────────────────────────────────── */

/**
 * How much to trust a measurement, derived from how big the reference is.
 *
 * This is a real error bar, not a model's opinion: at `cm_per_px`, a corner
 * placed two pixels wrong moves the edge by `2 * cm_per_px`.
 */
export function referenceConfidence(quad, imageWidth, longCm) {
  const ordered = orderQuad(quad);
  const spanPx = span(ordered);
  if (!(spanPx > 0)) throw new MeasurementError("The reference has no size in the photo.");

  const cmPerPx = longCm / spanPx;
  const ratio = imageWidth ? spanPx / imageWidth : 0;
  const confidence =
    ratio >= HIGH_SPAN ? "high" : ratio >= MEDIUM_SPAN ? "medium" : "low";

  return {
    confidence,
    reference_span_px: Math.round(spanPx * 10) / 10,
    frame_fraction: Math.round(ratio * 1000) / 1000,
    scale_cm_per_px: Math.round(cmPerPx * 100000) / 100000,
    estimated_error_cm: Math.round(cmPerPx * CORNER_ERROR_PX * 100) / 100,
  };
}

/* ── the measurement itself ─────────────────────────────────────────────── */

/**
 * Measure board quads against a reference quad.
 *
 * reference: { quad: [[x, y] × 4], long_cm: 29.7, short_cm: 21.0 }
 * boards:    [{ label: "Board 1", quad: [[x, y] × 4] }, ...]
 *
 * Returns the same shape /api/measure already answers with, plus the scale and
 * error bar, so the panel and stored measurements need no changes.
 */
export function measureBoards(reference, boards, imageWidth) {
  if (!reference || !reference.quad) throw new MeasurementError("The reference needs a quad.");

  const longCm = Number(reference.long_cm) || 0;
  const shortCm = Number(reference.short_cm) || 0;
  if (longCm <= 0 || shortCm <= 0) {
    throw new MeasurementError("The reference needs long_cm and short_cm.");
  }

  const refQuad = alignReference(reference.quad, longCm, shortCm);
  if (span(refQuad) < 20) {
    throw new MeasurementError("The reference is too small in the photo to measure against.");
  }

  // image pixels -> centimetres on the reference plane
  const refCm = [
    [0, 0],
    [longCm, 0],
    [longCm, shortCm],
    [0, shortCm],
  ];
  const toCm = homography(refQuad, refCm);

  const items = boards.map((board, i) => {
    if (!board || !board.quad) throw new MeasurementError(`Board ${i + 1} has no quad.`);

    const quad = orderQuad(board.quad);
    const corners = applyHomography(toCm, quad);
    const edges = sideLengths(corners);

    let length = (edges[0] + edges[2]) / 2;
    let width = (edges[1] + edges[3]) / 2;
    if (width > length) [length, width] = [width, length];
    if (!(length > 0) || !(width > 0)) {
      throw new MeasurementError(`Board ${i + 1} collapsed to nothing — check its corners.`);
    }

    return {
      label: board.label || `Board ${i + 1}`,
      length_cm: Math.round(length * 10) / 10,
      width_cm: Math.round(width * 10) / 10,
      // a single overhead view cannot see thickness; the job's stock item
      // supplies it instead of a guess
      thickness_cm: null,
      material_guess: board.material_guess ?? null,
      condition: board.condition ?? null,
      quad: quad.map(([x, y]) => [Math.round(x * 10) / 10, Math.round(y * 10) / 10]),
    };
  });

  if (!items.length) throw new MeasurementError("No boards in that photo.");

  return {
    items,
    total_boards: items.length,
    reference_detected: true,
    recommended_product: null,
    plane_note:
      "Boards must sit in the same plane as the reference; thickness is not measurable here.",
    ...referenceConfidence(refQuad, imageWidth, longCm),
  };
}

/** Axis-aligned boxes -> quads, for a bbox-only detector. */
export function quadsFromBoxes(boxes) {
  return boxes.map((box, i) => {
    const [x1, y1, x2, y2] = Array.isArray(box)
      ? box
      : [box.x1, box.y1, box.x2, box.y2];
    return {
      label: (Array.isArray(box) ? null : box.label) || `Board ${i + 1}`,
      quad: [
        [x1, y1],
        [x2, y1],
        [x2, y2],
        [x1, y2],
      ],
    };
  });
}
