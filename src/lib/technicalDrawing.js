/* Projects buildGeometry3D's 3D box descriptors onto 2D blueprint views:
   front/side/top orthographic elevations plus an exploded isometric
   assembly diagram. Pure geometry — no SVG/DOM here, see DrawingsPanel. */
import { extent, explodedPosition } from "./geometry3d";

const EPS = 0.5; // a panel flush against another still counts as covered

const overlaps = (o, r) =>
  o.x < r.x + r.w - EPS && r.x < o.x + o.w - EPS && o.y < r.y + r.h - EPS && r.y < o.y + o.h - EPS;

/**
 * One orthographic view.
 *
 * Every box projects to a rectangle, so the drawing is only correct if the
 * rectangles are painted far-to-near: a door has to cover the shelf behind it,
 * not the other way round. Each rect also records whether something nearer
 * overlaps it, which the renderer draws as a hidden (dashed) edge.
 */
function buildView(boxes, { a, b, depth, shiftA = 0, shiftB = 0, boundsW, boundsH }) {
  const rects = boxes.map((box) => {
    const aHalf = extent(box, a) / 2;
    const bHalf = extent(box, b) / 2;
    const dHalf = extent(box, depth) / 2;
    return {
      id: box.id,
      label: box.name,
      material: box.material,
      x: box[a] + shiftA - aHalf,
      y: box[b] + shiftB - bHalf,
      w: aHalf * 2,
      h: bHalf * 2,
      near: box[depth] + dHalf,
      far: box[depth] - dHalf,
    };
  });

  rects.sort((p, q) => p.near - q.near || p.far - q.far);
  rects.forEach((rect) => {
    // Only a panel strictly nearer along the view axis can hide this one. Parts
    // sharing a depth (a leg and the apron beside it) sit side by side, not in
    // front of each other, so they must not erase one another.
    rect.hidden = rects.some((other) => other !== rect && other.near > rect.near + EPS && overlaps(other, rect));
  });

  return { rects, bounds: { minX: 0, maxX: boundsW, minY: 0, maxY: boundsH } };
}

export function projectFront(boxes, job) {
  const W = +job.W;
  const H = +job.H;
  // looking from +z, so z is the depth axis
  return buildView(boxes, { a: "x", b: "y", depth: "z", shiftA: W / 2, boundsW: W, boundsH: H });
}

export function projectSide(boxes, job) {
  const D = +job.D || (job.type === "Table" ? 600 : 570);
  const H = +job.H;
  // looking from +x, so x is the depth axis
  return buildView(boxes, { a: "z", b: "y", depth: "x", shiftA: D / 2, boundsW: D, boundsH: H });
}

export function projectTop(boxes, job) {
  const W = +job.W;
  const D = +job.D || (job.type === "Table" ? 600 : 570);
  // looking down from +y, so y is the depth axis
  return buildView(boxes, { a: "x", b: "z", depth: "y", shiftA: W / 2, shiftB: D / 2, boundsW: W, boundsH: D });
}

const COS30 = Math.cos(Math.PI / 6);
const SIN30 = Math.sin(Math.PI / 6);

function isoProject(x, y, z) {
  return { x: (x - z) * COS30, y: (x + z) * SIN30 - y };
}

function corners(box) {
  const hw = extent(box, "x") / 2;
  const hh = extent(box, "y") / 2;
  const hd = extent(box, "z") / 2;
  const { x, y, z } = box;
  return {
    topFace: [
      [x - hw, y + hh, z - hd],
      [x + hw, y + hh, z - hd],
      [x + hw, y + hh, z + hd],
      [x - hw, y + hh, z + hd],
    ],
    frontFace: [
      [x - hw, y - hh, z + hd],
      [x + hw, y - hh, z + hd],
      [x + hw, y + hh, z + hd],
      [x - hw, y + hh, z + hd],
    ],
    sideFace: [
      [x + hw, y - hh, z - hd],
      [x + hw, y - hh, z + hd],
      [x + hw, y + hh, z + hd],
      [x + hw, y + hh, z - hd],
    ],
  };
}

export function buildExploded(boxes, job) {
  const seen = {};
  const exploded = boxes.map((b) => ({ ...b, ...explodedPosition(b, job, seen) }));

  const parts = exploded.map((b) => {
    const { topFace, frontFace, sideFace } = corners(b);
    const toPoly = (face, shade) => ({
      shade,
      points: face.map(([x, y, z]) => {
        const p = isoProject(x, y, z);
        return [p.x, p.y];
      }),
    });
    return {
      id: b.id,
      label: b.name,
      faces: [toPoly(topFace, "top"), toPoly(sideFace, "right"), toPoly(frontFace, "left")],
    };
  });

  const allPoints = parts.flatMap((p) => p.faces.flatMap((f) => f.points));
  const xs = allPoints.map((p) => p[0]);
  const ys = allPoints.map((p) => p[1]);
  return {
    parts,
    bounds: {
      minX: Math.min(...xs),
      maxX: Math.max(...xs),
      minY: Math.min(...ys),
      maxY: Math.max(...ys),
    },
  };
}

export function dimensionLines(bounds, { side = "bottom", offset = 50, label } = {}) {
  const { minX, maxX, minY, maxY } = bounds;
  if (side === "bottom" || side === "top") {
    const y = side === "bottom" ? maxY + offset : minY - offset;
    return {
      line: { x1: minX, y1: y, x2: maxX, y2: y },
      ticks: [
        { x1: minX, y1: y - 12, x2: minX, y2: y + 12 },
        { x1: maxX, y1: y - 12, x2: maxX, y2: y + 12 },
      ],
      textPos: { x: (minX + maxX) / 2, y: y + (side === "bottom" ? 32 : -18) },
      text: label ?? `${Math.round(maxX - minX)} mm`,
    };
  }
  const x = side === "left" ? minX - offset : maxX + offset;
  return {
    line: { x1: x, y1: minY, x2: x, y2: maxY },
    ticks: [
      { x1: x - 12, y1: minY, x2: x + 12, y2: minY },
      { x1: x - 12, y1: maxY, x2: x + 12, y2: maxY },
    ],
    textPos: { x: side === "left" ? x - 28 : x + 28, y: (minY + maxY) / 2 },
    rotate: true,
    text: label ?? `${Math.round(maxY - minY)} mm`,
  };
}

export function buildTechnicalDrawing(job, plan, geometry) {
  const front = projectFront(geometry, job);
  const side = projectSide(geometry, job);
  const top = projectTop(geometry, job);
  const exploded = buildExploded(geometry, job);

  return {
    front: { ...front, dimH: dimensionLines(front.bounds, { side: "bottom" }), dimV: dimensionLines(front.bounds, { side: "left" }) },
    side: { ...side, dimH: dimensionLines(side.bounds, { side: "bottom" }), dimV: dimensionLines(side.bounds, { side: "left" }) },
    top: { ...top, dimH: dimensionLines(top.bounds, { side: "bottom" }), dimV: dimensionLines(top.bounds, { side: "left" }) },
    exploded,
  };
}
