/* ── Production stages — the Job Pipeline columns ── */
export const STAGES = [
  { key: "deposit", label: "Invoicing / Deposit" },
  { key: "design", label: "Design & 3D Review" },
  { key: "milling", label: "Cutting & Milling" },
  { key: "assembly", label: "Assembly & Joinery" },
  { key: "finishing", label: "Sanding & Finishing" },
  { key: "delivery", label: "Ready for Delivery" },
];
export const STAGE_KEYS = STAGES.map((s) => s.key);

/** Map the old status field onto a stage for existing jobs. */
export const STATUS_TO_STAGE = {
  quote: "deposit",
  progress: "milling",
  done: "finishing",
  delivered: "delivery",
};

export const stageProgress = (stage) => {
  const i = STAGE_KEYS.indexOf(stage);
  return i < 0 ? 0 : Math.round(((i + 1) / STAGE_KEYS.length) * 100);
};

/* ── Job types ── */
export const TYPES = [
  "Cabinet",
  "Wardrobe",
  "Counter / Desk",
  "Table",
  "Bed",
  "Bookshelf",
  "Door",
  "Other",
];

/* ── Timber the shop works with (Ghana market) ── */
export const WOOD_TYPES = [
  { name: "Mahogany", short: "MHG", tone: "#7b3f2a", pricePerSheet: 420 },
  { name: "Odum (Iroko)", short: "ODM", tone: "#8a6a2f", pricePerSheet: 380 },
  { name: "Wawa", short: "WAW", tone: "#c8a56b", pricePerSheet: 220 },
  { name: "Sapele", short: "SAP", tone: "#6e3b2c", pricePerSheet: 460 },
  { name: "MDF Board", short: "MDF", tone: "#9a8c76", pricePerSheet: 180 },
  { name: "Plywood", short: "PLY", tone: "#b99a6c", pricePerSheet: 150 },
];
export const woodByName = (name) => WOOD_TYPES.find((w) => w.name === name) || WOOD_TYPES[0];

export const CABINET_TYPES = [
  { name: "L-Shape Kitchen Cabinet", sheetsNeeded: 18, machineBase: 1976, fittingsBase: 3501, marbleBase: 10950 },
  { name: "Straight Kitchen Cabinet", sheetsNeeded: 10, machineBase: 1200, fittingsBase: 2000, marbleBase: 6000 },
  { name: "Wardrobe (Single)", sheetsNeeded: 8, machineBase: 900, fittingsBase: 1500, marbleBase: 0 },
  { name: "Wardrobe (Double)", sheetsNeeded: 14, machineBase: 1400, fittingsBase: 2500, marbleBase: 0 },
  { name: "TV Stand / Cabinet", sheetsNeeded: 5, machineBase: 700, fittingsBase: 1000, marbleBase: 0 },
  { name: "Counter / Reception Desk", sheetsNeeded: 12, machineBase: 1500, fittingsBase: 2200, marbleBase: 0 },
  { name: "Custom (Manual Entry)", sheetsNeeded: 0, machineBase: 0, fittingsBase: 0, marbleBase: 0 },
];

export const TYPE_TO_CAB = {
  Cabinet: "Straight Kitchen Cabinet",
  Wardrobe: "Wardrobe (Single)",
  "Counter / Desk": "Counter / Reception Desk",
  Table: "Custom (Manual Entry)",
  Bed: "Custom (Manual Entry)",
  Bookshelf: "Custom (Manual Entry)",
  Door: "Custom (Manual Entry)",
  Other: "Custom (Manual Entry)",
};

export const REF_OBJECTS = [
  "A4 paper (297×210mm)",
  "Standard brick (215×102mm)",
  "Credit card (85×54mm)",
  "20cm ruler",
  "Tape measure visible in photo",
  "Custom reference object",
];

/* ── Shop machinery — the schedule reserves against these ── */
export const MACHINES = [
  { key: "cnc", label: "CNC Router" },
  { key: "tablesaw", label: "Table Saw" },
  { key: "planer", label: "Thicknesser / Planer" },
  { key: "spray", label: "Spray Booth" },
  { key: "sander", label: "Wide-Belt Sander" },
];

/* ── First-run inventory seed ── */
export const LUMBER_SEED = [
  { id: "lm1", species: "Mahogany", thickness: "4/4", drying: "Kiln", bf: 320, reorder: 120 },
  { id: "lm2", species: "Mahogany", thickness: "8/4", drying: "Air", bf: 95, reorder: 100 },
  { id: "lm3", species: "Odum (Iroko)", thickness: "4/4", drying: "Kiln", bf: 210, reorder: 150 },
  { id: "lm4", species: "Sapele", thickness: "4/4", drying: "Kiln", bf: 60, reorder: 90 },
  { id: "lm5", species: "Wawa", thickness: "4/4", drying: "Air", bf: 540, reorder: 200 },
];

export const CONSUMABLES_SEED = [
  { id: "cs1", name: "18mm Plywood", unit: "sheets", qty: 24, reorder: 15 },
  { id: "cs2", name: "6mm MDF backing", unit: "sheets", qty: 9, reorder: 12 },
  { id: "cs3", name: 'Drawer slides 18"', unit: "pairs", qty: 30, reorder: 20 },
  { id: "cs4", name: "Soft-close hinges", unit: "pcs", qty: 140, reorder: 80 },
  { id: "cs5", name: "Wood glue 5L", unit: "tubs", qty: 3, reorder: 4 },
  { id: "cs6", name: "Sanding discs 120g", unit: "boxes", qty: 6, reorder: 5 },
];

export const DEFAULT_SETTINGS = {
  business: "Altops Furniture Enterprise",
  tagline: "Custom cabinets, counters & fitted furniture",
  location: "Near Asafo Labour R.D, Kumasi",
  phone: "0244622461",
  capacity: 6,
};

export const whatsappLink = (phone) => {
  const digits = String(phone || "").replace(/\D/g, "");
  const intl = digits.startsWith("0") ? "233" + digits.slice(1) : digits;
  return intl ? `https://wa.me/${intl}` : null;
};
