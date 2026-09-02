/* First-run seed. Fills empty localStorage collections once so the shop
   opens on a populated workshop, then never touches them again. */

import { CONSUMABLES_SEED, LUMBER_SEED } from "./constants";
import { emptyJob } from "./format";
import {
  flag,
  loadCollection,
  loadJobs,
  persistJob,
  persistMany,
} from "./storage";

const iso = (daysFromNow) => {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().slice(0, 10);
};

const DEMO_JOBS = [
  { title: "L-shape kitchen — Adjei residence", client: "Kwame Adjei", type: "Cabinet", species: "Sapele", stage: "milling", due: 9, W: "3600", H: "900", D: "600", price: "24800", deposit: "12000" },
  { title: "Double wardrobe — Osei apartment", client: "Ama Osei", type: "Wardrobe", species: "Mahogany", stage: "assembly", due: 4, W: "2400", H: "2200", D: "600", price: "13200", deposit: "6000" },
  { title: "Reception counter — TechHub Kumasi", client: "TechHub Ltd", type: "Counter / Desk", species: "Odum (Iroko)", stage: "design", due: 16, W: "2800", H: "1100", D: "700", price: "9600", deposit: "4000" },
  { title: "Boardroom table — GCB branch", client: "GCB Bank", type: "Table", species: "Sapele", stage: "finishing", due: 2, W: "3000", H: "760", D: "1200", price: "18500", deposit: "9000" },
  { title: "Bookshelf wall — Mensah study", client: "Yaw Mensah", type: "Bookshelf", species: "Wawa", stage: "deposit", due: 21, W: "2000", H: "2400", D: "320", price: "6400", deposit: "0" },
  { title: "6× bedframes — Golden Tulip", client: "Golden Tulip Hotel", type: "Bed", species: "Mahogany", stage: "delivery", due: -1, W: "1600", H: "1200", D: "2050", price: "21000", deposit: "15000" },
];

export async function seedIfEmpty() {
  if (flag.get("seeded") === "true") return;
  flag.set("seeded", "true");

  if ((await loadCollection("wlumber_")).length === 0) persistMany("wlumber_", LUMBER_SEED);
  if ((await loadCollection("wcons_")).length === 0) persistMany("wcons_", CONSUMABLES_SEED);

  if ((await loadJobs()).length === 0) {
    for (const d of DEMO_JOBS) {
      await persistJob({
        ...emptyJob(),
        ...d,
        due: iso(d.due),
        status: "progress",
      });
    }
  }
}
