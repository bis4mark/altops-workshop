export const STATUS = {
  quote: { label: "Quote", color: "quote" },
  progress: { label: "In progress", color: "progress" },
  done: { label: "Completed", color: "done" },
  delivered: { label: "Delivered", color: "delivered" },
};

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

export const WOOD_TYPES = [
  { name: "Mahogany", pricePerSheet: 420 },
  { name: "Odum (Iroko)", pricePerSheet: 380 },
  { name: "Wawa", pricePerSheet: 220 },
  { name: "Sapele", pricePerSheet: 460 },
  { name: "MDF Board", pricePerSheet: 180 },
  { name: "Plywood", pricePerSheet: 150 },
];

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

export const DEFAULT_SETTINGS = {
  business: "Altops Furniture Enterprise",
  tagline: "Custom cabinets, counters & fitted furniture",
  location: "Near Asafo Labour R.D, Kumasi",
  phone: "0244622461",
  about:
    "A Kumasi workshop building fitted kitchens, wardrobes, reception counters and " +
    "office furniture to order. Every piece is measured on site, cut from your choice " +
    "of board or solid timber, and finished in the workshop before it goes in.",
};

/** Ghana mobile -> wa.me link. 0244622461 -> https://wa.me/233244622461 */
export const whatsappLink = (phone) => {
  const digits = String(phone || "").replace(/\D/g, "");
  const intl = digits.startsWith("0") ? "233" + digits.slice(1) : digits;
  return intl ? `https://wa.me/${intl}` : null;
};
