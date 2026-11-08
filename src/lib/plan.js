/* Cut-list engine.
   Given a job's outer W×H×D plus board thickness / shelf / door counts, work
   out every panel to cut, then pack them onto full sheets (2440×1220 by
   default) and keep the layout: which piece sits where, what is left over,
   and how much of each sheet actually gets used.

   Packing is a best-fit shelf algorithm. Pieces can rotate 90° unless they
   carry a grain flag, because a door or a side panel with the grain running
   the wrong way is scrap. */

/** Common sheet sizes the shop buys. */
export const SHEET_SIZES = [
  { key: "2440x1220", w: 2440, h: 1220, label: "2440 × 1220 (8×4 ft)" },
  { key: "2745x1220", w: 2745, h: 1220, label: "2745 × 1220 (9×4 ft)" },
  { key: "2440x1830", w: 2440, h: 1830, label: "2440 × 1830 (8×6 ft)" },
];

export const DEFAULT_SHEET = SHEET_SIZES[0];

const MIN_OFFCUT = 120; // narrower than this is sawdust, not a usable offcut

/* `grain` names the dimension that has to follow the sheet's long axis:
   "L" or "Wd". A side panel is cut D×H but the grain runs up the 1800, so it
   is "Wd"; a door is cut H×W with the grain along H, so it is "L". */
function carcassParts(W, H, D, t, shelves, doors) {
  const innerW = W - 2 * t;
  const parts = [];
  const add = (name, mat, L, Wd, qty, grain = null) => {
    if (qty > 0 && L > 0 && Wd > 0) {
      parts.push({ name, mat, L: Math.round(L), Wd: Math.round(Wd), qty, grain });
    }
  };
  add("Side panel", "Carcass", D, H, 2, "Wd");
  add("Top / bottom", "Carcass", innerW, D, 2);
  if (shelves > 0) add("Shelf", "Carcass", innerW, D - 20, shelves);
  if (doors > 0) add("Door", "Carcass", H - 4, W / doors - 3, doors, "L");
  add("Back panel", "Back", W, H, 1);
  return parts;
}

function tableParts(L, W, H, t) {
  const parts = [];
  const add = (name, mat, a, b, qty, grain = null) =>
    parts.push({ name, mat, L: Math.round(a), Wd: Math.round(b), qty, grain });
  add("Top", "Carcass", L, W, 1, "L");
  add("Leg", "Carcass", H - t, 89, 4);
  add("Apron (long)", "Carcass", L - 178, 89, 2, "L");
  add("Apron (short)", "Carcass", W - 178, 89, 2);
  return parts;
}

/** Allowed [w, h] placements for one piece. The sheet's long axis is X. */
function orientations(piece, keepGrain) {
  const along = keepGrain ? piece.grain : null;
  if (along === "L") return [[piece.L, piece.Wd]];
  if (along === "Wd") return [[piece.Wd, piece.L]];
  return [[piece.L, piece.Wd], [piece.Wd, piece.L]];
}

/**
 * Best-fit shelf packing that keeps the layout.
 * Returns { sheets, count, used, area, yield }.
 */
export function packMaterial(pieces, { sheetW = 2440, sheetH = 1220, kerf = 3, grain = true } = {}) {
  const queue = pieces
    .map((p) => ({ ...p }))
    .sort((a, b) => Math.max(b.L, b.Wd) - Math.max(a.L, a.Wd) || b.L * b.Wd - a.L * a.Wd);

  const sheets = [];

  const fits = (sheet, piece) => {
    const gap = (shelf) => (shelf.x > 0 ? kerf : 0);
    // best fit: the shelf with the least room left that still takes the piece
    let best = null;
    let bestRoom = Infinity;
    for (const shelf of sheet.shelves) {
      for (const [w, h] of orientations(piece, grain)) {
        if (h > shelf.height) continue;
        const room = sheetW - shelf.x - gap(shelf) - w;
        if (room < 0) continue;
        if (room < bestRoom) {
          bestRoom = room;
          best = { shelf, w, h };
        }
        break;
      }
    }
    if (best) return { kind: "shelf", ...best };
    const y = sheet.bottom > 0 ? sheet.bottom + kerf : 0;
    for (const [w, h] of orientations(piece, grain)) {
      if (y + h <= sheetH && w <= sheetW) return { kind: "newShelf", w, h, y };
    }
    return null;
  };

  for (const piece of queue) {
    let placed = false;
    for (const sheet of sheets) {
      const spot = fits(sheet, piece);
      if (!spot) continue;
      if (spot.kind === "shelf") {
        const gap = spot.shelf.x > 0 ? kerf : 0;
        spot.shelf.pieces.push({
          x: spot.shelf.x + gap,
          y: spot.shelf.y,
          w: spot.w,
          h: spot.h,
          name: piece.name,
          rotated: spot.w !== piece.L,
        });
        spot.shelf.x += gap + spot.w;
      } else {
        sheet.shelves.push({ y: spot.y, height: spot.h, x: spot.w, pieces: [
          { x: 0, y: spot.y, w: spot.w, h: spot.h, name: piece.name, rotated: spot.w !== piece.L },
        ] });
        sheet.bottom = spot.y + spot.h;
      }
      placed = true;
      break;
    }
    if (placed) continue;

    const options = orientations(piece, grain);
    const fitsAny = options.find(([w, h]) => w <= sheetW && h <= sheetH);
    // A piece bigger than the sheet still gets a sheet of its own, marked, so
    // the panel can say "this will not fit" instead of quietly dropping it.
    const [w, h] = fitsAny || options[0];
    sheets.push({
      shelves: [{ y: 0, height: h, x: w, pieces: [{ x: 0, y: 0, w, h, name: piece.name, rotated: w !== piece.L }] }],
      bottom: h,
      overflow: !fitsAny,
    });
  }

  const area = sheetW * sheetH;
  let used = 0;
  const laid = sheets.map((sheet, i) => {
    const piecesOnSheet = sheet.shelves.flatMap((s) => s.pieces);
    const offcuts = [];
    for (const shelf of sheet.shelves) {
      const w = sheetW - shelf.x;
      if (w >= MIN_OFFCUT) offcuts.push({ x: shelf.x, y: shelf.y, w, h: shelf.height });
    }
    const bottomH = sheetH - sheet.bottom;
    if (bottomH >= MIN_OFFCUT) offcuts.push({ x: 0, y: sheet.bottom, w: sheetW, h: bottomH });
    used += piecesOnSheet.reduce((sum, p) => sum + p.w * p.h, 0);
    return { index: i + 1, pieces: piecesOnSheet, offcuts, overflow: !!sheet.overflow };
  });

  const total = area * laid.length;
  return {
    sheets: laid,
    count: laid.length,
    used,
    area: total,
    // an oversize piece can put more area on a sheet than the sheet holds;
    // the overflow flag is the real warning, so cap the number at 100%
    yield: total ? Math.min(1, used / total) : 0,
  };
}

export function buildPlan(job, t, shelves, doors, opts = {}) {
  const W = +job.W;
  const H = +job.H;
  const D = +job.D;
  if (!W || !H) return null;

  const sheet = opts.sheet || DEFAULT_SHEET;
  const kerf = opts.kerf ?? 3;
  const grain = opts.grain !== false;

  const parts =
    job.type === "Table"
      ? tableParts(W, D || 600, H, t)
      : carcassParts(W, H, D || 570, t, shelves, doors);

  const groups = {};
  for (const part of parts) {
    (groups[part.mat] ||= []);
    for (let i = 0; i < part.qty; i += 1) {
      groups[part.mat].push({ L: part.L, Wd: part.Wd, name: part.name, grain: part.grain });
    }
  }
  const boards = Object.entries(groups).map(([mat, pieces]) => {
    const packed = packMaterial(pieces, { sheetW: sheet.w, sheetH: sheet.h, kerf, grain });
    return { mat, count: packed.count, ...packed };
  });

  return {
    parts,
    boards,
    t,
    shelves,
    doors,
    sheet: { w: sheet.w, h: sheet.h, label: sheet.label },
    kerf,
    grain,
    at: Date.now(),
  };
}
