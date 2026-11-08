/* Synthetic ground-truth tests for measureGeometry — the same scene and the
   same expected numbers as measure/test_measure_core.py.

   No camera, no dataset, no GPU: a pinhole camera projects a scene of known
   centimetre dimensions onto pixels, and the core has to recover the dimensions
   it was never told. Run with:

       node --test src/lib/measureGeometry.test.js
*/

import assert from "node:assert/strict";
import { test } from "node:test";

import {
  MeasurementError,
  applyHomography,
  homography,
  measureBoards,
  orderQuad,
  quadsFromBoxes,
  referenceConfidence,
} from "./measureGeometry.js";

const IMAGE_W = 3000;
const IMAGE_H = 2000;

const A4_LONG = 29.7;
const A4_SHORT = 21.0;

const BOARDS = [
  { label: "Board 1", x: 40, y: 0, long: 120, short: 60 },
  { label: "Board 2", x: 40, y: 80, long: 200, short: 30 },
  { label: "Board 3", x: 300, y: 0, long: 45, short: 45 },
];

/* ── the synthetic scene ────────────────────────────────────────────────── */

const matMul = (A, B) =>
  A.map((row) => B[0].map((_, j) => row.reduce((s, v, k) => s + v * B[k][j], 0)));

const matVec = (A, v) => A.map((row) => row.reduce((s, val, k) => s + val * v[k], 0));

/**
 * World plane (z=0, cm) -> pixels, for a pinhole camera looking down.
 * `tiltDeg` tips the camera off vertical (the perspective a hand-held phone
 * introduces); `yawDeg` spins it in the plane.
 */
function cameraHomography({ focalPx, tiltDeg = 0, yawDeg = 0, heightCm = 200, centre = [60, 40] }) {
  const tilt = (tiltDeg * Math.PI) / 180;
  const yaw = (yawDeg * Math.PI) / 180;

  const rx = [
    [1, 0, 0],
    [0, Math.cos(tilt), -Math.sin(tilt)],
    [0, Math.sin(tilt), Math.cos(tilt)],
  ];
  const rz = [
    [Math.cos(yaw), -Math.sin(yaw), 0],
    [Math.sin(yaw), Math.cos(yaw), 0],
    [0, 0, 1],
  ];
  const base = [
    [1, 0, 0],
    [0, -1, 0],
    [0, 0, -1],
  ];

  const R = matMul(base, matMul(rx, rz));
  const t = matVec(R, [centre[0], centre[1], heightCm]).map((v) => -v);

  const M = [
    [R[0][0], R[0][1], t[0]],
    [R[1][0], R[1][1], t[1]],
    [R[2][0], R[2][1], t[2]],
  ];
  const K = [
    [focalPx, 0, IMAGE_W / 2],
    [0, focalPx, IMAGE_H / 2],
    [0, 0, 1],
  ];
  return matMul(K, M);
}

const rectCorners = (x, y, long, short) => [
  [x, y],
  [x + long, y],
  [x + long, y + short],
  [x, y + short],
];

const project = (H, corners) => applyHomography(H, corners);

function scene(H) {
  return {
    reference: { quad: project(H, rectCorners(0, 0, A4_LONG, A4_SHORT)), long_cm: A4_LONG, short_cm: A4_SHORT },
    boards: BOARDS.map((b) => ({
      label: b.label,
      quad: project(H, rectCorners(b.x, b.y, b.long, b.short)),
    })),
  };
}

/** Compare each recovered board against the ground truth it was built from. */
function dimsError(result) {
  assert.equal(result.items.length, BOARDS.length);
  let worst = 0;
  result.items.forEach((item, i) => {
    const truth = BOARDS[i];
    worst = Math.max(
      worst,
      Math.abs(item.length_cm - truth.long),
      Math.abs(item.width_cm - truth.short),
    );
  });
  return worst;
}

/* ── tests ──────────────────────────────────────────────────────────────── */

test("homography round-trips through its inverse", () => {
  const src = [[0, 0], [100, 0], [100, 50], [0, 50]];
  const dst = [[10, 20], [300, 40], [280, 190], [5, 170]];
  const H = homography(src, dst);

  const back = applyHomography(invert3(H), dst);
  back.forEach((p, i) => {
    assert.ok(Math.abs(p[0] - src[i][0]) < 1e-8, `x ${p[0]} vs ${src[i][0]}`);
    assert.ok(Math.abs(p[1] - src[i][1]) < 1e-8, `y ${p[1]} vs ${src[i][1]}`);
  });
});

test("orderQuad is stable under a shuffled input", () => {
  const quad = [[10, 10], [110, 10], [110, 60], [10, 60]];
  const shuffled = [quad[2], quad[0], quad[3], quad[1]];
  assert.deepEqual(orderQuad(shuffled), orderQuad(quad));
});

test("fronto-parallel camera recovers exact sizes", () => {
  const { reference, boards } = scene(cameraHomography({ focalPx: 6000 }));
  const result = measureBoards(reference, boards, IMAGE_W);
  assert.ok(dimsError(result) < 0.05, `worst error ${dimsError(result)} cm`);
  assert.equal(result.confidence, "high");
});

test("tilted camera still exact", () => {
  // 20 degrees off vertical: the far edge of a board is measurably smaller than
  // the near edge in pixels, and the homography has to undo it.
  const { reference, boards } = scene(cameraHomography({ focalPx: 6000, tiltDeg: 20 }));
  const result = measureBoards(reference, boards, IMAGE_W);
  assert.ok(dimsError(result) < 0.2, `worst error ${dimsError(result)} cm`);
});

test("spun camera still exact", () => {
  const { reference, boards } = scene(cameraHomography({ focalPx: 6000, yawDeg: 35 }));
  const result = measureBoards(reference, boards, IMAGE_W);
  assert.ok(dimsError(result) < 0.2, `worst error ${dimsError(result)} cm`);
});

test("corner order does not matter", () => {
  const { reference, boards } = scene(cameraHomography({ focalPx: 6000, tiltDeg: 15 }));
  const shuffled = boards.map((b) => ({
    label: b.label,
    quad: [b.quad[2], b.quad[3], b.quad[0], b.quad[1]],
  }));

  const a = measureBoards(reference, boards, IMAGE_W);
  const b = measureBoards(reference, shuffled, IMAGE_W);
  assert.deepEqual(
    a.items.map((i) => [i.length_cm, i.width_cm]),
    b.items.map((i) => [i.length_cm, i.width_cm]),
  );
});

test("a bounding box is worse than a quad under tilt", () => {
  // The reason the detector must return corners, not boxes: under tilt an
  // axis-aligned box swallows the perspective skew and overstates the size.
  const { reference, boards } = scene(cameraHomography({ focalPx: 6000, tiltDeg: 25 }));
  const quadErr = dimsError(measureBoards(reference, boards, IMAGE_W));

  const boxes = boards.map((b) => {
    const xs = b.quad.map((p) => p[0]);
    const ys = b.quad.map((p) => p[1]);
    return { label: b.label, x1: Math.min(...xs), y1: Math.min(...ys), x2: Math.max(...xs), y2: Math.max(...ys) };
  });
  const boxErr = dimsError(measureBoards(reference, quadsFromBoxes(boxes), IMAGE_W));

  assert.ok(quadErr < boxErr, `quad ${quadErr} should beat box ${boxErr}`);
});

test("confidence falls when the reference shrinks", () => {
  // A4 spans 29.7 * focal / height pixels, so these give roughly 30%, 12% and
  // 3.5% of the 3000 px frame width.
  const levels = [6000, 2400, 700].map((focalPx) => {
    const { reference, boards } = scene(cameraHomography({ focalPx }));
    return measureBoards(reference, boards, IMAGE_W).confidence;
  });
  assert.deepEqual(levels, ["high", "medium", "low"]);
});

test("error bar grows as the reference shrinks", () => {
  const close = referenceConfidence(
    project(cameraHomography({ focalPx: 6000 }), rectCorners(0, 0, A4_LONG, A4_SHORT)),
    IMAGE_W,
    A4_LONG,
  );
  const far = referenceConfidence(
    project(cameraHomography({ focalPx: 700 }), rectCorners(0, 0, A4_LONG, A4_SHORT)),
    IMAGE_W,
    A4_LONG,
  );
  assert.ok(far.estimated_error_cm > close.estimated_error_cm);
});

test("a degenerate reference raises", () => {
  const reference = { quad: [[0, 0], [10, 10], [20, 20], [30, 30]], long_cm: A4_LONG, short_cm: A4_SHORT };
  assert.throws(
    () => measureBoards(reference, [{ quad: [[0, 0], [50, 0], [50, 50], [0, 50]] }], IMAGE_W),
    MeasurementError,
  );
});

test("a tiny reference raises", () => {
  const reference = { quad: [[0, 0], [8, 0], [8, 6], [0, 6]], long_cm: A4_LONG, short_cm: A4_SHORT };
  assert.throws(
    () => measureBoards(reference, [{ quad: [[20, 20], [60, 20], [60, 40], [20, 40]] }], IMAGE_W),
    MeasurementError,
  );
});

test("a reference without a size raises", () => {
  const reference = { quad: [[0, 0], [300, 0], [300, 200], [0, 200]] };
  assert.throws(
    () => measureBoards(reference, [{ quad: [[0, 0], [50, 0], [50, 50], [0, 50]] }], IMAGE_W),
    MeasurementError,
  );
});

function invert3(M) {
  const [[a, b, c], [d, e, f], [g, h, i]] = M;
  const A = e * i - f * h;
  const B = -(d * i - f * g);
  const C = d * h - e * g;
  const det = a * A + b * B + c * C;
  return [
    [A / det, -(b * i - c * h) / det, (b * f - c * e) / det],
    [B / det, (a * i - c * g) / det, -(a * f - c * d) / det],
    [C / det, -(a * h - b * g) / det, (a * e - b * d) / det],
  ];
}
