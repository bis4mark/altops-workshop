/* Builds a box-per-panel 3D stand-in from a cut plan (see lib/plan.js).
   Not real joinery — one box/hardware primitive per part, positioned to
   approximate the assembled carcass/table so a preview can show rough
   proportions, wood tone and hardware style. */

function doorHardware(doorBox, hardwareStyle, idx) {
  const edgeX = doorBox.x >= 0 ? doorBox.x + doorBox.w / 2 - 25 : doorBox.x - doorBox.w / 2 + 25;
  const z = doorBox.z + doorBox.d / 2 + (hardwareStyle === "knob" ? 10 : 6);
  if (hardwareStyle === "knob") {
    return {
      id: `hw-${idx}`,
      name: "Knob",
      shape: "knob",
      material: "hardware",
      radius: 9,
      height: 18,
      x: edgeX,
      y: doorBox.y,
      z,
    };
  }
  return {
    id: `hw-${idx}`,
    name: "Handle",
    shape: "bar",
    material: "hardware",
    w: 10,
    h: 120,
    d: 10,
    x: edgeX,
    y: doorBox.y,
    z,
  };
}

function carcassGeometry(job, plan, hardwareStyle) {
  const W = +job.W;
  const H = +job.H;
  const D = +job.D || 570;
  const t = plan.t;
  const shelves = plan.shelves;
  const doors = plan.doors;
  const species = job.species;
  const boxes = [];

  boxes.push(
    { id: "side-l", name: "Side panel", shape: "box", textureKey: species, w: t, h: H, d: D, x: -(W / 2 - t / 2), y: H / 2, z: 0 },
    { id: "side-r", name: "Side panel", shape: "box", textureKey: species, w: t, h: H, d: D, x: W / 2 - t / 2, y: H / 2, z: 0 },
    { id: "bottom", name: "Top / bottom", shape: "box", textureKey: species, w: W - 2 * t, h: t, d: D, x: 0, y: t / 2, z: 0 },
    { id: "top", name: "Top / bottom", shape: "box", textureKey: species, w: W - 2 * t, h: t, d: D, x: 0, y: H - t / 2, z: 0 },
    { id: "back", name: "Back panel", shape: "box", textureKey: "Plywood", w: W, h: H, d: t, x: 0, y: H / 2, z: -(D / 2 - t / 2) }
  );

  for (let i = 1; i <= shelves; i += 1) {
    boxes.push({
      id: `shelf-${i}`,
      name: "Shelf",
      shape: "box",
      textureKey: species,
      w: W - 2 * t,
      h: t,
      d: D - 20,
      x: 0,
      y: (i * H) / (shelves + 1),
      z: 0,
    });
  }

  if (doors > 0) {
    const doorW = W / doors - 3;
    for (let i = 0; i < doors; i += 1) {
      const door = {
        id: `door-${i}`,
        name: "Door",
        shape: "box",
        textureKey: species,
        w: doorW,
        h: H - 4,
        d: t,
        x: -W / 2 + doorW * (i + 0.5) + 1.5,
        y: H / 2,
        z: D / 2 + t / 2,
      };
      boxes.push(door, doorHardware(door, hardwareStyle, i));
    }
  }

  return boxes;
}

function tableGeometry(job, plan) {
  const L = +job.W;
  const W = +job.D || 600;
  const H = +job.H;
  const t = plan.t;
  const species = job.species;
  const legT = 89;
  const inset = legT / 2 + 5;
  const boxes = [];

  boxes.push({ id: "top", name: "Top", shape: "box", textureKey: species, w: L, h: t, d: W, x: 0, y: H - t / 2, z: 0 });

  const xs = [-(L / 2 - inset), L / 2 - inset];
  const zs = [-(W / 2 - inset), W / 2 - inset];
  let legIdx = 0;
  for (const x of xs) {
    for (const z of zs) {
      boxes.push({
        id: `leg-${legIdx}`,
        name: "Leg",
        shape: "box",
        textureKey: species,
        w: legT,
        h: H - t,
        d: legT,
        x,
        y: (H - t) / 2,
        z,
      });
      legIdx += 1;
    }
  }

  const apronY = H - t - 45;
  boxes.push(
    { id: "apron-long-0", name: "Apron (long)", shape: "box", textureKey: species, w: L - 178, h: 89, d: legT, x: 0, y: apronY, z: -(W / 2 - inset) },
    { id: "apron-long-1", name: "Apron (long)", shape: "box", textureKey: species, w: L - 178, h: 89, d: legT, x: 0, y: apronY, z: W / 2 - inset },
    { id: "apron-short-0", name: "Apron (short)", shape: "box", textureKey: species, w: legT, h: 89, d: W - 178, x: -(L / 2 - inset), y: apronY, z: 0 },
    { id: "apron-short-1", name: "Apron (short)", shape: "box", textureKey: species, w: legT, h: 89, d: W - 178, x: L / 2 - inset, y: apronY, z: 0 }
  );

  return boxes;
}

export function buildGeometry3D(job, plan, hardwareStyle = "bar") {
  if (!plan || !job.W || !job.H) return [];
  return job.type === "Table" ? tableGeometry(job, plan) : carcassGeometry(job, plan, hardwareStyle);
}
