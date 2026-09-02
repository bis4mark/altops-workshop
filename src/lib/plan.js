/* Cut-list engine.
   Given a job's outer W×H×D plus board thickness / shelf / door counts, work
   out every panel to cut, then shelf-pack them onto 8×4 (2440×1220 mm) sheets
   to estimate how many sheets each material needs. */

function carcassParts(W, H, D, t, shelves, doors) {
  const innerW = W - 2 * t;
  const parts = [];
  const add = (name, mat, L, Wd, qty) => {
    if (qty > 0 && L > 0 && Wd > 0) {
      parts.push({ name, mat, L: Math.round(L), Wd: Math.round(Wd), qty });
    }
  };
  add("Side panel", "Carcass", D, H, 2);
  add("Top / bottom", "Carcass", innerW, D, 2);
  if (shelves > 0) add("Shelf", "Carcass", innerW, D - 20, shelves);
  if (doors > 0) add("Door", "Carcass", H - 4, W / doors - 3, doors);
  add("Back panel", "Back", W, H, 1);
  return parts;
}

function tableParts(L, W, H, t) {
  const parts = [];
  const add = (name, mat, a, b, qty) =>
    parts.push({ name, mat, L: Math.round(a), Wd: Math.round(b), qty });
  add("Top", "Carcass", L, W, 1);
  add("Leg", "Carcass", H - t, 89, 4);
  add("Apron (long)", "Carcass", L - 178, 89, 2);
  add("Apron (short)", "Carcass", W - 178, 89, 2);
  return parts;
}

/** First-fit shelf packing. Returns how many sheets the pieces need. */
function packMaterial(pieces, sheetW, sheetH, kerf) {
  const norm = pieces.map((p) => {
    let w = p.L;
    let h = p.Wd;
    if (h > w) [w, h] = [h, w];
    return { ...p, w, h };
  });
  norm.sort((a, b) => b.h - a.h || b.w - a.w);

  const sheets = [];
  for (const piece of norm) {
    if (piece.w > sheetW || piece.h > sheetH) {
      if (piece.h <= sheetW && piece.w <= sheetH) {
        [piece.w, piece.h] = [piece.h, piece.w];
      }
    }
    let placed = false;
    for (const sheet of sheets) {
      for (const shelf of sheet.shelves) {
        const gap = shelf.x > 0 ? kerf : 0;
        const orientations = [
          [piece.w, piece.h],
          [piece.h, piece.w],
        ];
        let chosen = null;
        for (const [ow, oh] of orientations) {
          if (shelf.x + gap + ow <= sheetW && oh <= shelf.height) {
            chosen = [ow, oh];
            break;
          }
        }
        if (chosen) {
          shelf.x += gap + chosen[0];
          placed = true;
          break;
        }
      }
      if (placed) break;
      const nextY = sheet.bottom > 0 ? sheet.bottom + kerf : 0;
      if (nextY + piece.h <= sheetH) {
        sheet.shelves.push({ x: piece.w, height: piece.h });
        sheet.bottom = nextY + piece.h;
        placed = true;
        break;
      }
    }
    if (!placed) {
      sheets.push({ shelves: [{ x: piece.w, height: piece.h }], bottom: piece.h });
    }
  }
  return sheets.length;
}

export function buildPlan(job, t, shelves, doors) {
  const W = +job.W;
  const H = +job.H;
  const D = +job.D;
  if (!W || !H) return null;

  const parts =
    job.type === "Table"
      ? tableParts(W, D || 600, H, t)
      : carcassParts(W, H, D || 570, t, shelves, doors);

  const groups = {};
  for (const part of parts) {
    (groups[part.mat] ||= []);
    for (let i = 0; i < part.qty; i += 1) {
      groups[part.mat].push({ L: part.L, Wd: part.Wd });
    }
  }
  const boards = Object.entries(groups).map(([mat, pieces]) => ({
    mat,
    count: packMaterial(pieces, 2440, 1220, 3),
  }));

  return { parts, boards, t, shelves, doors, at: Date.now() };
}
