/* Projects buildGeometry3D's 3D box descriptors onto 2D blueprint views:
   front/side/top orthographic elevations plus an exploded isometric
   assembly diagram. Pure geometry — no SVG/DOM here, see DrawingsPanel. */

const SIZE_FOR_AXIS = { x: "w", y: "h", z: "d" };

function extent(box, axis) {
  if (box.shape === "knob") return box.radius * 2;
  return box[SIZE_FOR_AXIS[axis]] ?? 0;
}

function boxToRect(box, axisA, axisB) {
  const aHalf = extent(box, axisA) / 2;
  const bHalf = extent(box, axisB) / 2;
  return {
    id: box.id,
    label: box.name,
    x: box[axisA] - aHalf,
    y: box[axisB] - bHalf,
    w: aHalf * 2,
    h: bHalf * 2,
  };
}

function project(boxes, axisA, axisB, boundsW, boundsH) {
  return {
    rects: boxes.map((b) => boxToRect(b, axisA, axisB)),
    bounds: { minX: 0, maxX: boundsW, minY: 0, maxY: boundsH },
  };
}

export function projectFront(boxes, job) {
  const W = +job.W;
  const H = +job.H;
  return project(
    boxes.map((b) => ({ ...b, x: b.x + W / 2 })),
    "x",
    "y",
    W,
    H
  );
}

export function projectSide(boxes, job) {
  const D = +job.D || (job.type === "Table" ? 600 : 570);
  const H = +job.H;
  return project(
    boxes.map((b) => ({ ...b, z: b.z + D / 2 })),
    "z",
    "y",
    D,
    H
  );
}

export function projectTop(boxes, job) {
  const W = +job.W;
  const D = +job.D || (job.type === "Table" ? 600 : 570);
  return project(
    boxes.map((b) => ({ ...b, x: b.x + W / 2, z: b.z + D / 2 })),
    "x",
    "z",
    W,
    D
  );
}

const EXPLODE_GAP = 60;
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
  const W = +job.W;
  const H = +job.H;
  const D = +job.D || (job.type === "Table" ? 600 : 570);
  const seen = {};

  const exploded = boxes.map((b) => {
    const nx = Math.abs(b.x) / (W / 2 || 1);
    const ny = Math.abs(b.y - H / 2) / (H / 2 || 1);
    const nz = Math.abs(b.z) / (D / 2 || 1);
    const dominant = nx >= ny && nx >= nz ? "x" : ny >= nz ? "y" : "z";

    const centerOnAxis = dominant === "y" ? H / 2 : 0;
    let sign = Math.sign(b[dominant] - centerOnAxis);
    if (sign === 0) {
      const group = `${b.name}-${dominant}`;
      seen[group] = (seen[group] || 0) + 1;
      sign = seen[group] % 2 === 0 ? -1 : 1;
    }
    const offset = sign * (EXPLODE_GAP + extent(b, dominant) * 0.6);

    return { ...b, [dominant]: b[dominant] + offset };
  });

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

export function dimensionLines(bounds, { side = "bottom", offset = 30, label } = {}) {
  const { minX, maxX, minY, maxY } = bounds;
  if (side === "bottom" || side === "top") {
    const y = side === "bottom" ? maxY + offset : minY - offset;
    return {
      line: { x1: minX, y1: y, x2: maxX, y2: y },
      ticks: [
        { x1: minX, y1: y - 6, x2: minX, y2: y + 6 },
        { x1: maxX, y1: y - 6, x2: maxX, y2: y + 6 },
      ],
      textPos: { x: (minX + maxX) / 2, y: y + (side === "bottom" ? 16 : -10) },
      text: label ?? `${Math.round(maxX - minX)} mm`,
    };
  }
  const x = side === "left" ? minX - offset : maxX + offset;
  return {
    line: { x1: x, y1: minY, x2: x, y2: maxY },
    ticks: [
      { x1: x - 6, y1: minY, x2: x + 6, y2: minY },
      { x1: x - 6, y1: maxY, x2: x + 6, y2: maxY },
    ],
    textPos: { x: side === "left" ? x - 10 : x + 10, y: (minY + maxY) / 2 },
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
